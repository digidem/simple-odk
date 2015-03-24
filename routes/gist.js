var router = require('express').Router({ mergeParams: true });
var FormSubmissionMiddleware = require('openrosa-form-submission-middleware');

var GithubAuth = require('../middlewares/github-auth-passthrough');
var ProcessSubmission = require('../middlewares/process-submission');
var SaveMedia = require('../middlewares/save-media');

var saveForm = require('../controllers/save-form-gist');

/**
 * Tiny middleware to add an s3 bucket name of the form simple-odk.gist_id
 * AWS user arn:aws:iam::018729244327:user/simple-odk will need `s3:PutObject` and
 * `s3:PutObjectAcl` permissions for the bucket
 */
function addS3bucket(req, res, next) {
    if (req.params.s3bucket) return next();
    req.params.s3bucket = [process.env.APP_NAME, req.params.gist_id].join('.');
    next();
}

router.use(GithubAuth());

router.route('/submission')
    .all(FormSubmissionMiddleware())
    .post(ProcessSubmission())
    .post(addS3bucket)
    .post(SaveMedia())
    .post(saveForm);

module.exports = router;
