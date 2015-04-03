/**
 * A simple proxy for forms stored in Github, passes through Basic Auth and
 * adds appropriate content-type headers
 */
module.exports = function (req, res, next) {
  res.set('content-type', 'text/xml')
  var formStream = res.locals.store.getForm(req.params.id)
  formStream.on('error', next)
  formStream.pipe(res)
}
