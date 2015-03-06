// Saves a file to the local filesystem

var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var config = require('../config.js');

module.exports = function(data, options, callback) {
    filename = config.filesystem.path + options.filename;
    mkdirp(path.dirname(filename), function(err, made) {
        if (err) console.log(err);
        if (data instanceof stream.Readable) {
            var fileStream = fs.createWriteStream(filename);
            data.pipe(fileStream);
            data.on('end', callback);
        } else {
            console.log("writing to " + filename);
            fs.writeFile(filename, data, callback);
        }
    });
};
