var request = require('request')
var getCharset = require('charset')

/**
 * Proxies a request to `url` adding a `content-type` header from
 * `options.type`. Useful for Github raw, which always sets `content-type` to
 * `text/plain`
 * @param  {String} url     Url to proxy the request to
 * @param  {http.IncomingMessage} res    Response stream
 * @param  {Object} options Any options to pass through to `request` plus
 * `options.contentType`, the content-type header you want to add. Defaults to
 * `text/xml`
 */
module.exports = function (url, res, options) {
  request.get(url, options).on('response', function (incoming) {
    // If the upstream server served this file with a specific character
    // encoding, so should we.
    var charset = getCharset(incoming.headers['content-type'])
    var type = options.contentType || incoming.headers['content-type']

    if (charset) type += '; charset=' + charset

    // We need to correct the content type on proxied formLists from Github, which are served
    // as text/plain by default, which ODK Collect does not like.
    incoming.headers['content-type'] = type
    res.writeHead(incoming.statusCode, incoming.headers)
    incoming.pipe(res)
  })
  .on('error', function (err) {
    console.log(err)
    res.statusCode(500).send('Problem connecting to form server')
  })
}
