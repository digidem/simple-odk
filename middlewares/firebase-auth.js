var basicAuth = require('basic-auth')
var request = require('request')
var debug = require('debug')('simple-odk:fb-auth')
var cacheManager = require('cache-manager')
var createHash = require('../helpers/sha-hash.js')

var authCache = cacheManager.caching({store: 'memory', max: 500, ttl: 300})

/**
 * Middleware to authenticate to Firebase with Basic Auth. Attaches the
 * authenticated Firebase ref to the req object
 */
function FirebaseAuth () {
  return function (req, res, next) {
    var auth = basicAuth(req)
    var firebaseApp = req.params.appname
    var t0 = Date.now()

    if (auth === undefined || !firebaseApp) return unauthorized()

    debug('checking firebase auth')

    // We're going to cache the firebase Auth token for this user/password combo
    var cacheKey = 'fb_auth' + firebaseApp + createHash(req.headers.authorization)
    console.log(cacheKey)

    // Check if we have already checked this user/pass
    // and attach the Firebase auth token to the request
    authCache.wrap(cacheKey, function (cb) {
      debug('authorizing against firebase app', firebaseApp)
      getAuthToken({
        name: auth.name,
        pass: auth.pass,
        appname: firebaseApp
      }, cb)
    }, function (err, token) {
      if (!err) {
        req.firebase_token = token
        debug('user authorized in %s ms', Date.now() - t0)
        next()
      } else if (err.statusCode === 401) {
        unauthorized()
      } else {
        next(err)
      }
    })

    function unauthorized () {
      res.statusCode = 401
      res.setHeader('WWW-Authenticate', 'Basic realm=simple-odk')
      res.send('Unauthorized')
    }
  }
}

function getAuthToken (options, callback) {
  var authUrl = 'https://auth.firebase.com/v2/' + options.appname +
    '/auth/password?email=' + options.name +
    '&password=' + options.pass +
    '&transport=json'
  request.get(authUrl, function (err, response, body) {
    if (response.statusCode === 200) {
      console.log(err)
      try {
        var token = JSON.parse(body).token
        console.log(token)
        callback(null, token)
      } catch (e) {
        console.log(e)
        callback(e)
      }
    } else {
      console.log(err)
      err = err || new Error('Authentication error')
      err.status = response.statusCode
      callback(err)
    }
  })
}

module.exports = FirebaseAuth
