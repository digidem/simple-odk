/**
 * The form submission middleware saves the files to `tmp` and attaches
 * a `files` object to `req`, with properties `file.path`, `file.headers` and
 * `file.size` see https://github.com/andrewrk/node-multiparty/#file-name-file
 *
 * This middleware saves each file to the chosen storage.
 */

var extend = require('xtend');
var fs = require('fs');
var debug = require('debug')('simple-odk:save-media');
var persistS3 = require('../helpers/persist-s3');
var persistFs = require('../helpers/persist-fs');
var updateFileRef = require('../helpers/update-file-ref');

var defaults = {
    store: process.env.MEDIA_STORE || 's3'
};

function SaveMedia(options) {
    var store;

    options = extend(defaults, options);

    // Choose the appropriate storage mechanism for saving media
    switch (options.store) {
        case 'fs':
        store = persistFs;
        break;
        default:
        store = persistS3;
    }

    return function(req, res, next) {
        if (!req.files.length) return next();
        if (!req.submission) return next(new Error('no form submission found'));
        debug('Received %s media files with submission', req.files.length);

        var taskCount = 0;
        var s3bucket = req.params.s3bucket;

        req.files.forEach(function(file) {
            var storeOptions = {
                filename: req.submission.instanceId + '/' + file.originalFilename,
                s3bucket: s3bucket,
                file: file
            };

            store(fs.createReadStream(file.path), storeOptions, function onSave(err, url) {
                if (err) onError(err);
                // store a reference to where the file is now stored on the file object
                file.url = url;
                updateFileRef(req.submission.json, file);
                taskCount++;
                // Quick and dirty check whether we have processed all the files
                if (taskCount < req.files.length) return;
                cleanupFiles();
                next();
            });
        });

        function onError(err) {
            cleanupFiles();
            next(err);
        }

        /**
         * The form submission middleware saves all the files to disk
         * Now we have stored them we must delete the temp files or disk
         * space will quickly fill up.
         */
        function cleanupFiles() {
            req.files.forEach(function(file) {
                fs.unlink(file.path, function(err) {
                    if (err) console.error('Error deleting file %s', file.path);
                });
            });
        }
    };
}

module.exports = SaveMedia;
