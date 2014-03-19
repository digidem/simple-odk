var fs = require('fs');
var Github = require('github-api');
var knox = require('knox');
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var stream = require('stream');
var config = require('../config.js');

var github = new Github({
    token: process.env.GITHUB_TOKEN,
    auth: "oauth"
});

var s3Client = knox.createClient({
    key: process.env.S3_KEY,
    secret: process.env.S3_SECRET,
    bucket: config.s3.bucket
});

module.exports = function(data, filename, headers, callback) {
    if (config.formStore === "github" && headers["content-type"] === "text/xml") {
        persistGithub.apply(this, arguments);
    } else if (config.mediaStore === "s3" && headers["content-type"] !== "text/xml") {
        persistS3.apply(this, arguments);
    } else {
        persistFileSystem.apply(this, arguments);
    }
};

function persistS3(data, filename, headers, callback) {
    var req = s3Client.put(filename, headers);

    data.pipe(req);

    req.on('error', callback);

    req.on('progress', function(w, t, p) {
        console.log("uploading...",w,t,p);
    });

    req.on('response', function(res) {
        callback(null, res);
    });
}

function persistGithub(data, filename, headers, callback) {
    var repo = github.getRepo(config.github.user, config.github.repo);
    repo.write(config.github.branch, filename, data, "Added new form response " + filename, callback);
}

function persistFileSystem(data, filename, headers, callback) {
    filename = config.filesystem.path + filename;
    mkdirp(path.dirname(filename), function(err, made) {
        if (data instanceof stream.Readable) {
            var fileStream = fs.createWriteStream(filename);
            data.pipe(fileStream);
            data.on('end', callback);
        } else {
            fs.writeFile(filename, data, callback);
        }
    });
}
