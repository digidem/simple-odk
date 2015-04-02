var basicAuth = require('basic-auth')
var request = require('request')
var debug = require('debug')('simple-odk:github-auth')
var cacheManager = require('cache-manager')
var createHash = require('../helpers/sha-hash.js')

var authCache = cacheManager.caching({store: 'memory', max: 500, ttl: 300/*seconds*/})

request = request.defaults({
  headers: { 'User-Agent': 'simple-odk' }
})

/**
 * Middleware to authenticate against Github using Basic Auth.
 * Github will return status 404 for unauthorized requests
 * https://developer.github.com/v3/auth/#basic-authentication
 * This checks a user/pass is valid against Github and returns
 * 401 to the ODK Collect client if it not
 */
function GithubAuth () {
  return function (req, res, next) {
    var auth = basicAuth(req)
    var t0 = Date.now()

    if (auth === undefined) return unauthorized()

    debug('checking github auth')

    // We're going to cache auth details for 5 mins, so we avoid
    // repeat lookups on Github, but we'll only cache a hash of
    // the auth header, for a little added security
    var cacheKey = 'gh_auth' + createHash(req.headers.authorization)

    // Check if we have already checked this user/pass
    // Authorization will always be handled by the Github API,
    // this just caches our check which initially forces ODK collect
    // to send an Authorization header
    authCache.wrap(cacheKey, function (cb) {
      debug('authorizing against api.github.com/user')
      checkAuth(auth, cb)
    }, function (err, isAuthenticated) {
      if (err) return next(err)
      isAuthenticated ? authorized() : unauthorized()
    })

    function authorized () {
      debug('user authorized in %s ms', Date.now() - t0)
      next()
    }

    function unauthorized () {
      res.statusCode = 401
      res.setHeader('WWW-Authenticate', 'Basic realm=simple-odk')
      res.send('Unauthorized')
    }
  }
}

function checkAuth (auth, callback) {
  request
    .head('https://api.github.com/user')
    .auth(auth.name, auth.pass, true)
    .on('error', callback)
    .on('response', function (response) {
      var authfail = (response.statusCode === 401 || response.statusCode === 404)
      if (authfail) return callback(null, false)
      if (response.statusCode === 200) return callback(null, true)
      var err = new Error('Authentication error')
      err.status = response.statusCode
      callback(err)
    })
}

module.exports = GithubAuth
