var router = require('express').Router({ mergeParams: true })
var FormSubmissionMiddleware = require('openrosa-form-submission-middleware')

var FirebaseAuth = require('../middlewares/firebase-auth')
var ProcessSubmission = require('../middlewares/process-submission')
var SaveMedia = require('../middlewares/save-media')
var addS3bucket = require('../middlewares/s3')

var saveForm = require('../controllers/firebase/save-form-firebase')

router.use(FirebaseAuth())

router.route('/submission')
  .all(FormSubmissionMiddleware())
  .post(ProcessSubmission())
  .post(addS3bucket)
  .post(SaveMedia())
  .post(saveForm)

module.exports = router
