// Saves a String, Buffer or Stream to Amazon S3

var knox = require('knox');
var config = require('../config');
var stream = require('stream');

var s3Client = knox.createClient({
    key: config.s3.key,
    secret: config.s3.secret,
    bucket: config.s3.bucket
});

module.exports = function(data, options, callback) {
    var req = s3Client.put(options.filename, options.headers);

    req.on('error', callback);

    req.on('progress', function(w, t, p) {
        console.log("uploading...", w, t, p);
    });

    req.on('response', function(res) {
        callback(null, res);
    });

    if (data instanceof stream.Readable) {
        data.pipe(req);
    } else {
        req.end(data);
    }
};
