// Saves a file to github

var Octokat  = require('octokat');
var Hubfs = require('hubfs.js');
var extend = require('xtend');
var basicAuth = require('basic-auth');
var debug = require('debug')('simple-odk:save-form-github');

var defaults = {
    branch: 'master'
};

function saveForm(req, res, next) {
    var submission = req.submission,
        user = req.params.user,
        repo = req.params.repo,
        ext = submission.geojson ? '.geojson' : '.json',
        filename = 'submissions/' + submission.formId + '/' + submission.instanceId + ext,
        json = JSON.stringify(submission.json, null, '  '),
        auth = basicAuth(req),
        options = extend(defaults, options);

    var octo = new Octokat({
        username: auth.name,
        password: auth.pass
    });

    var writeOptions = {
        message: 'Added new form response ' + filename,
        branch: options.branch
    };

    var hubfs = new Hubfs(octo.repos(user, repo));

    hubfs.writeFile(filename, json, writeOptions, function(err) {
        if (err) return next(err);
        debug('saved form response %s to github repo %s', filename, user + '/' + repo);
        res.status(201).end();
    });
}

module.exports = saveForm;
