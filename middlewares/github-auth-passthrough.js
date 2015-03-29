var basicAuth = require('basic-auth')
var request = require('request')
var debug = require('debug')('simple-odk:github-auth')
var NodeCache = require('node-cache')
var createHash = require('../helpers/sha-hash.js')

var authCache = new NodeCache({ stdTTL: 300 })

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
    var hash = createHash(req.headers.authorization)

    // Check if we have already checked this user/pass
    // Authorization will always be handled by the Github API,
    // this just caches our check which initially forces ODK collect
    // to send and Authorization header
    authCache.get(hash, function (err, value) {
      if (!err & value[hash]) {
        debug('user auth cached, authorized')
        return next()
      }

      debug('authorizing against api.github.com/user')
      request
        .get('https://api.github.com/user')
        .auth(auth.name, auth.pass, true)
        .on('error', next)
        .on('response', function (response) {
          var unauthorized = (response.statusCode === 401 || response.statusCode === 404)
          if (unauthorized) return unauthorized()
          if (response.statusCode === 200) return authorized(hash)
          var err = new Error('Authentication error')
          err.status = response.statusCode
          next(err)
        })
    })

    function authorized (hash) {
      // Cache the authorization in memory for 5 mins
      authCache.set(hash, true)
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

module.exports = GithubAuth
