var request = require('request')
var debug = require('debug')('simple-odk:save-form-firebase')

// Saves a submission to firebase
function saveForm (req, res, next) {
  var submission = req.submission
  var t0 = Date.now()

  var url = 'https://' + req.params.appname + '.firebaseio.com/submissions/' +
    submission.formId + '/' +
    submission.instanceId + '?auth=' +
    req.firebase_token

  request({
    url: url,
    method: 'POST',
    body: submission.json,
    json: true
  }, function (err, response, body) {
    if (err) return next(err)
    res.status(201).send({
      saved: submission.instanceId
    })
    debug('saved form %s to firebase in %s ms', submission.instanceId, Date.now() - t0)
  })
}

module.exports = saveForm
