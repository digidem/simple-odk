var auth = require('basic-auth')
var request = require('request')

request = request.defaults({
  headers: { 'User-Agent': 'simple-odk' }
})

/**
 * Middleware to authenticate against Github using Basic Auth.
 */
function GithubAuth () {
  return function (req, res, next) {
    var user = auth(req)

    if (user === undefined) return unauthorized()

    request
      .get('https://api.github.com/user')
      .auth(user.name, user.pass, true)
      .on('response', function (response) {
        if (response.statusCode === 401) return unauthorized()
        if (response.statusCode === 200) return next()
        var err = new Error('Authentication error')
        err.status = response.statusCode
        next(err)
      })
      .on('error', next)

    function unauthorized () {
      res.statusCode = 401
      res.setHeader('WWW-Authenticate', 'Basic realm=simple-odk')
      res.send('Unauthorized')
    }
  }
}

module.exports = GithubAuth
