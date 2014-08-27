// Saves a file to github

var Github = require('github-api');
var config = require('../config.js');

module.exports = function(data, options, callback) {
    var github = new Github({
        username: options.auth.name,
        password: options.auth.pass,
        auth: "basic"
    });

    var repo = github.getRepo(config.github.user, config.github.repo);

    repo.write(config.github.branch, options.filename, data, "Added new form response " + options.filename, callback);
};
