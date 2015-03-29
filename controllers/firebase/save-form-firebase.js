// Saves a submission to firebase

var debug = require('debug')('simple-odk:save-form-firebase')

function saveForm (req, res, next) {
  var submission = req.submission
  var ref = req.firebase
  var t0 = Date.now()

  ref.child('submissions')
    .child(submission.formId)
    .child(submission.instanceId)
    .set(submission.json, function (err) {
      if (err) return next(err)
      debug('saved form %s to firebase in %s ms', submission.instanceId, Date.now() - t0)
      res.status(201).send({
        saved: submission.instanceId
      })
    })
}

module.exports = saveForm
