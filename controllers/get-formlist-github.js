/**
 * Proxies a request for a formlist to github ensuring it returns the correct
 * content-type headers
 */

var basicAuth = require('basic-auth');
var async = require('async');
var debug = require('debug')('simple-odk:get-formlist-github');
var getFormStreams = require('../helpers/get-form-streams-github');
var parseFormMeta = require('../helpers/parse-form-meta');
var createFormlist = require('../helpers/create-formlist');

module.exports = function(req, res, next) {
  var auth = basicAuth(req);

  var options = {
    user: req.params.user,
    repo: req.params.repo
  };

  if (auth) {
    options.auth = {
      name: auth.name,
      pass: auth.pass
    };
  }

  getFormStreams(options, function(err, formStreams) {
    if (err) return next(err);
    async.map(formStreams, parseFormMeta, function(err, formMeta) {
      if (err) next(err);
      res.status(200).send(createFormlist(formMeta));
    });
  });

};


