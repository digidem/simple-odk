var basicAuth = require('basic-auth')
var createFormList = require('openrosa-formlist')
var debug = require('debug')('simple-odk:get-formlist-github')
var cacheManager = require('cache-manager')

var getFormUrls = require('../../helpers/get-form-urls-github')

// Cache up to 10Mb of formLists in memory, with a 5 min TTL
var formListCache = cacheManager.caching({
  store: 'memory',
  max: 10 * 1000 * 1000,
  ttl: 5 * 60, /*seconds*/
  length: function (s) { return s.length }
})

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

  var cacheKey = options.user + '/' + options.repo

  debug('Called formList for repo %s', cacheKey)

  formListCache.wrap(cacheKey, getFormListXml, function (err, buff) {
    if (err) return next(err)
    var formListXml = buff.toString()
    res.set('content-type', 'text/xml; charset=utf-8')
    res.status(200).send(formListXml)
  })

  function getFormListXml (cb) {
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

      createFormList(formUrls, formlistOptions, function (err, xml) {
        if (err) return cb(err)
        cb(null, new Buffer(xml))
      })
    })
  }
}
