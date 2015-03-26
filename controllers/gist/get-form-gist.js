var proxy = require('../../helpers/proxy-content-type')

/**
 * A simple proxy for forms stored in gist,
 * adds appropriate content-type headers
 * The gist raw url should be passed as the `url` query string.
 */
module.exports = function (req, res) {
  var options = {
    contentType: 'text/xml'
  }

  proxy(req.query.url, res, options)
}
