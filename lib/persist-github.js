// Saves a file to github

var Github = require('github-api');
var debug = require('debug')('simple-odk:persist-github');
var config = require('../config.js');

module.exports = function(data, options, callback) {
    var github = new Github({
        username: options.auth.name,
        password: options.auth.pass,
        auth: "basic"
    });

    var repo = github.getRepo(options.user, options.repo);

    repo.write("master", options.filename, data, "Added new form response " + options.filename, function(err) {
        debug('saved form response %s to github repo %s', options.filename, options.user + '/' + options.repo);
        callback(err, options.filename);
    });
};
