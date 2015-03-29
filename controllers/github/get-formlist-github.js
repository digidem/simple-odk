var basicAuth = require('basic-auth')
var createFormList = require('openrosa-formlist')
var debug = require('debug')('simple-odk:get-formlist-github')
var cacheManager = require('cache-manager')

var getFormUrls = require('../../helpers/get-form-urls-github')

var formListCache = cacheManager.caching({store: 'memory', max: 500, ttl: 300/*seconds*/})

/**
 * Searches for xml form files on Github and returns a valid
 * OpenRosa formList xml.
 */
module.exports = function (req, res, next) {
  var auth = basicAuth(req)
  var protocol = 'http' //req.hostname === 'localhost' ? 'http' : 'https'

  var options = {
    user: req.params.user,
    repo: req.params.repo,
    auth: auth || {},
    headers: {
      'User-Agent': 'simple-odk'
    },
    baseUrl: protocol + '://' + req.headers.host + req.baseUrl + '/forms'
  }

  var cacheKey = options.user + '/' + options.repo

  debug('Called formList for repo %s auth %s', cacheKey)

  formListCache.wrap(cacheKey, function (cb) {
    getFormUrls(options, function (err, formUrls) {
      if (err) return next(err)
      debug('got form urls', formUrls)

      var formlistOptions = {
        headers: options.headers,
        auth: {
          user: options.auth.name,
          pass: options.auth.pass
        }
      }

      createFormList(formUrls, formlistOptions, cb)
    })
  }, function (err, formlistXml) {
    if (err) return next(err)
    res.set('content-type', 'text/xml; charset=utf-8')
    res.status(200).send(formlistXml)
  })
}
