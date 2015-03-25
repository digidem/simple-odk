/**
 * Proxies a request for a formlist to github ensuring it returns the correct
 * content-type headers
 */

var basicAuth = require('basic-auth');
var createFormList = require('openrosa-formlist');
var debug = require('debug')('simple-odk:get-formlist-github');
var getFormUrls = require('../helpers/get-form-urls-github');

module.exports = function(req, res, next) {
  var auth = basicAuth(req);
  var protocol = req.hostname === 'localhost' ? 'http' : 'https';

  var options = {
    user: req.params.user,
    repo: req.params.repo,
    headers: {
      'User-Agent': 'simple-odk'
    },
    baseUrl: protocol + '://' + req.headers.host + req.baseUrl + '/forms',
  };

  if (auth) {
    options.auth = auth;
    options.auth.user = auth.name;
  }

  debug('Called formList for repo %s auth %s', options.user + '/' + options.repo, auth && auth.name);

  getFormUrls(options, function(err, formUrls) {
    if (err) return next(err);
    debug('get form urls', formUrls);

    var formlistOptions = {
      headers: options.headers,
      auth: options.auth
    };

    createFormList(formUrls, formlistOptions, function(err, formlistXml) {
      if (err) return next(err);
      res.set('content-type', 'text/xml; charset=utf-8');
      res.status(200).send(formlistXml);
    });
  });
};
