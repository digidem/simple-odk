var router = require('express').Router({ mergeParams: true })
var FormSubmissionMiddleware = require('openrosa-form-submission-middleware')

var FirebaseAuth = require('../middlewares/firebase-auth')
var ProcessSubmission = require('../middlewares/process-submission')
var SaveMedia = require('../middlewares/save-media')

var saveForm = require('../controllers/firebase/save-form-firebase')

/**
 * Tiny middleware to add an s3 bucket name of the form simple-odk.firebaseappname
 * AWS user arn:aws:iam::018729244327:user/simple-odk will need `s3:PutObject` and
 * `s3:PutObjectAcl` permissions for the bucket
 */
function addS3bucket (req, res, next) {
  if (req.params.s3bucket) return next()
  req.params.s3bucket = [process.env.APP_NAME, req.params.appname].join('.')
  next()
}

router.use(FirebaseAuth())

router.route('/submission')
  .all(FormSubmissionMiddleware())
  .post(ProcessSubmission())
  .post(addS3bucket)
  .post(SaveMedia())
  .post(saveForm)

module.exports = router
