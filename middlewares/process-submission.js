var xform2json = require('xform-to-json')
var extend = require('xtend')
var debug = require('debug')('simple-odk:process-submission')

var defaults = {
  geojson: true
}

/**
 * Converts form xml in `req.body` to json, adds meta data, attaches data to
 * `req.submission`
 */
function ProcessSubmission (options) {
  return function (req, res, next) {
    if (!req.body.length) {
      return next(new Error('No form submission found'))
    }

    debug('Received xml submission')

    options = extend(defaults, options)

    options.meta = extend(options.meta, {
      deviceId: req.query.deviceID,
      submissionTime: new Date()
    })

    xform2json(req.body, options, function (err, form) {
      if (err) return next(err)
      var meta = options.geojson ? form.properties.meta : form.meta
      meta = extend({}, meta)
      meta.instanceId = meta.instanceId.replace(/^uuid:/, '')
      meta.ext = options.geojson ? 'geojson' : 'json'

      res.locals.submission = {
        json: form,
        xml: req.body,
        meta: meta
      }

      debug('Processed xml submission as json')
      next()
    })
  }
}

module.exports = ProcessSubmission
