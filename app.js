if (process.env.NODE_ENV==='production') {
    require('nodetime').profile({
        accountKey: process.env.NODETIME_ACCOUNT_KEY,
        appName: 'SimpleODK'
    });
}
var express = require('express');
var logger = require('morgan');
var debug = require('debug')('simple-odk:core');
var fs = require('fs');
var path = require('path');
var auth = require('basic-auth');
var xform2json = require('xform-to-json');
var traverse = require('traverse');
var formSubmissionMiddleware = require('openrosa-form-submission-middleware');

var config = require('./config.js');
var saveMedia = require('./lib/persist-s3.js');
var saveForm = require('./lib/persist-github.js');
var simpleProxy = require('./lib/simple-proxy.js');
var requireAuth = require('./lib/github-auth-passthrough');

var app = express();

var S3_NAMESPACE = 'simpleodk';

// Use 'dev' log formatting see http://www.senchalabs.org/connect/logger.html
app.use(logger('dev'));

app.use(function(err, req, res, next) {
    res.status(err.status || 500).send(err.message);
});

// *TODO* add a page describing the service here.
app.get('/', function(req, res) {
    res.send("Hello World");
});

// Proxy requests to formList to github
app.get('/:user/:repo/formList', requireAuth, function(req, res) {
    proxyUrl = 'https://raw.githubusercontent.com/' + 
                req.params.user + '/' + 
                req.params.repo + '/master/forms/formList';
    simpleProxy(req, res, proxyUrl);
});

// Use form submission middleware to parse data, saving temp files.
app.route('/:user/:repo/submission')
    .all(requireAuth)
    .all(formSubmissionMiddleware())
    .post(function(req, res, next) {
    // Counter for async tasks on the xml req.body and each or req.files
    var taskCount = 1 + req.files.length;
    debug('Received xml submission and %s files', req.files.length);

    var s3bucket = [S3_NAMESPACE, req.params.user, req.params.repo].join('.');

    var options = {
        geojson: true,
        meta: {
            deviceId: req.query.deviceID,
            submissionTime: new Date()
        }
    };

    xform2json(req.body, options, function(err, form) {
        if (err) onError(err);
        var meta = options.geojson ? form.properties.meta : form.meta;
        var instanceId = meta.instanceId.replace(/^uuid:/, "");
        var s3baseUrl = "https://s3.amazonaws.com/" + s3bucket + "/" + instanceId + "/";

        // Update references to media files to include links to the file stored on s3
        traverse(form).forEach(function(value) {
            req.files.forEach(function(file) {
                if (file.originalFilename === value) {
                    this.update({
                        url: s3baseUrl + file.originalFilename,
                        originalFilename: file.originalFilename
                    }, true);
                } 
            }, this);
        });

        var ext = options.geojson ? ".geojson" : ".json";

        // Place forms in a folder named with the formId, and name the form from its instanceId
        options = {
            filename: meta.formId + "/" + instanceId + ext,
            auth: auth(req),
            user: req.params.user,
            repo: req.params.repo
        };

        // save form submission to github
        saveForm(JSON.stringify(form, null, "    "), options, onSave);

        req.files.forEach(function(file) {
            var options = {
                filename: instanceId + '/' + file.originalFilename,
                s3bucket: s3bucket,
                file: file
            };
            // save attached media files to Amazon S3
            saveMedia(fs.createReadStream(file.path), options, onSave);
        });
    });

    function onSave(err) {
        if (err) onError(err);
        taskCount--;
        if (taskCount > 0) return;
        cleanupFiles();
        res.status(201).end();
    }

    function onError(err) {
        cleanupFiles();
        next(err);
    }

    function cleanupFiles() {
        req.files.forEach(function(file) {
            fs.unlink(file.path, function(err) {
                if (err) debug('Error deleting file %s', file.path);
            });
        });
    }
});

// Start server
var port = process.env.PORT || 8080;
app.listen(port);
console.log('Listening on port ' + port);
