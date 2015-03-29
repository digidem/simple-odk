var auth = require('basic-auth')
var Firebase = require('firebase')
var debug = require('debug')('simple-odk:fb-auth')
var NodeCache = require('node-cache')
var createHash = require('../helpers/sha-hash.js')

var authCache = new NodeCache({ stdTTL: 300 })

/**
 * Middleware to authenticate to Firebase with Basic Auth. Attaches the
 * authenticated Firebase ref to the req object
 */
function FirebaseAuth () {
  return function (req, res, next) {
    var user = auth(req)
    var firebaseApp = req.params.appname
    var t0 = Date.now()

    if (user === undefined || !firebaseApp) return unauthorized()

    debug('checking firebase auth')

    // We're going to cache auth details for 5 mins, so we avoid
    // repeat lookups on Firebase, but we'll only cache a hash of
    // the auth header, for a little added security
    var hash = createHash(req.headers.authorization)

    // Check if we have already checked this user/pass
    // and attach the Firebase object to the request
    // this just caches our check which initially forces ODK collect
    // to send and Authorization header
    authCache.get(hash, function (err, value) {
      if (!err & value[hash]) {
        req.firebase = value[hash]
        debug('user auth cached, authorized in %s ms', Date.now() - t0)
        return next()
      }

      var ref = new Firebase('https://' + firebaseApp + '.firebaseio.com')

      ref.authWithPassword({
        email: user.name,
        password: user.pass
      }, authHandler)

      function authHandler (err) {
        if (err) return unauthorized()
        // Cache the authorization in memory for 5 mins
        authCache.set(hash, ref)
        req.firebase = ref
        debug('authorized user in %s ms', Date.now() - t0)
        next()
      }

      function unauthorized () {
        res.statusCode = 401
        res.setHeader('WWW-Authenticate', 'Basic realm=simple-odk')
        res.send('Unauthorized')
      }
    }
  }
}

module.exports = FirebaseAuth
