/**
 * A simple proxy for forms stored in Github, passes through Basic Auth and
 * adds appropriate content-type headers
 */
module.exports = function (req, res, next) {
  res.set('content-type', 'text/xml')
  var baseUrl = 'http://' + req.headers.host + req.baseUrl + '/forms'
  var formListStream = res.locals.store.getFormList(baseUrl)
  formListStream.on('error', next)
  formListStream.pipe(res)
}
