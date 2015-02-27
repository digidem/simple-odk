// Saves a String, Buffer or Stream to Amazon S3

var knox = require('knox');
var config = require('../config');
var stream = require('stream');
var debug = require('debug')('simple-odk:persist-s3');

module.exports = function(data, options, callback) {

    var s3Client = knox.createClient({
        key: config.s3key,
        secret: config.s3secret,
        bucket: options.s3bucket
    });

    var headers = {
        "content-length": options.file.size,
        "content-type": options.file.headers['content-type']
    };

    var req = s3Client.put(options.filename, headers);

    req.on('error', callback);

    req.on('progress', function(w, t, p) {
        debug("uploading...", w, t, p);
    });

    req.on('response', function(res) {
        if (res.statusCode === 200) {
            debug('wrote %s to %s', options.filename, req.url);
            callback(null, req.url);
        } else if (res.statusCode === 404) {
            callback(new Error('Bucket not found'));
        } else {
            callback(new Error('S3 Error'));
        }
    });

    if (data instanceof stream.Readable) {
        data.pipe(req);
    } else {
        req.end(data);
    }
};
