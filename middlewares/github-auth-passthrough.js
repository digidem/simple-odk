var basicAuth = require('basic-auth')
var request = require('request')
var NodeCache = require('node-cache')
var avon = require('avon')

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

    if (auth === undefined) return unauthorized()

    // We use a blake2b hash of the authoriation header to cache auth
    // details, as a little added security that avoids user passwords
    // being accessed from the cache store
    avon.blake2b(req.headers.authorization, function (err, buffer) {
      if (err) return next(err)

      var hash = buffer.toString('hex')

      // Check if we have already checked this user/pass
      // Authorization will always be handled by the Github API,
      // this just caches our check which initially forces ODK collect
      // to send and Authorization header
      authCache.get(hash, function (err, value) {
        if (!err & value[hash]) return next()

        request
          .get('https://api.github.com/user')
          .auth(auth.name, auth.pass, true)
          .on('response', function (response) {
            var unauthorized = (response.statusCode === 401 || response.statusCode === 404)
            if (unauthorized) return unauthorized()
            if (response.statusCode === 200) return authorized(hash)
            var err = new Error('Authentication error')
            err.status = response.statusCode
            next(err)
          })
          .on('error', next)
      })
    })

    function authorized (hash) {
      // Cache the authorization in memory for 5 mins
      authCache.set(hash, true)
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
