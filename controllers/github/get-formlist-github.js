var basicAuth = require('basic-auth')
var createFormList = require('openrosa-formlist')
var debug = require('debug')('simple-odk:get-formlist-github')
var getFormUrls = require('../../helpers/get-form-urls-github')

/**
 * Searches for xml form files on Github and returns a valid
 * OpenRosa formList xml.
 */
module.exports = function (req, res, next) {
  var auth = basicAuth(req)
  var protocol = req.hostname === 'localhost' ? 'http' : 'https'

  var options = {
    user: req.params.user,
    repo: req.params.repo,
    auth: auth || {},
    headers: {
      'User-Agent': 'simple-odk'
    },
    baseUrl: protocol + '://' + req.headers.host + req.baseUrl + '/forms'
  }

  debug('Called formList for repo %s auth %s', options.user + '/' + options.repo)

  getFormUrls(options, function (err, formUrls) {
    if (err) return next(err)
    debug('got form urls', formUrls)

    var formlistOptions = {
      headers: options.headers,
      auth: {
        name: options.auth.name,
        pass: options.auth.pass
      }
    }

    createFormList(formUrls, formlistOptions, function (err, formlistXml) {
      if (err) return next(err)
      res.set('content-type', 'text/xml; charset=utf-8')
      res.status(200).send(formlistXml)
    })
  })
}
