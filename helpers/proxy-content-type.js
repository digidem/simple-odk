var request = require('request')
var getCharset = require('charset')

/**
 * Proxies a request to `url` adding a `content-type` header from
 * `options.type`. Useful for Github raw, which always sets `content-type` to
 * `text/plain`. Other options are passed through to  `request`
 * @param  {String} url     Url to proxy the request to
 * @param  {http.IncomingMessage} res    Response stream
 * @param  {Object} options Any options to pass through to `request` plus
 * `options.contentType`, the content-type header you want to add. Defaults to
 * `text/xml`
 * @return {Stream} A readable stream of the proxy response with modified headers
 */
module.exports = function (url, options) {
  var stream = request.get(url, options)

  stream.on('response', function (incoming) {
    // If the upstream server served this file with a specific character
    // encoding, so should we.
    var charset = getCharset(incoming.headers['content-type'])
    var type = options.contentType || incoming.headers['content-type']
    if (charset) type += '; charset=' + charset
    // We need to correct the content type on proxied formLists from Github, which are served
    // as text/plain by default, which ODK Collect does not like.
    stream.headers['content-type'] = type
  })

  return stream
}
