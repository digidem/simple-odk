var resumer = require('resumer')

module.exports = function (req, res, next) {
  var meta = res.locals.submission.meta
  var formJson = JSON.stringify(res.locals.submission.json, null, '  ')
  var saveStream = res.locals.store.saveForm(meta)
  saveStream.on('finished', res.send.bind(null, 200))
  saveStream.on('error', next)
  var r = resumer().queue(formJson)
  r.pipe(saveStream).end()
}
