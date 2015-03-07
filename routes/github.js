var router = require('express').Router({ mergeParams: true });
var FormSubmissionMiddleware = require('openrosa-form-submission-middleware');

var GithubAuth = require('../middlewares/github-auth-passthrough');
var ProcessSubmission = require('../middlewares/process-submission');
var SaveMedia = require('../middlewares/save-media');

var saveForm = require('../controllers/save-form-github');
var getFormlist = require('../controllers/get-formlist-github');

function addS3bucket(req, res, next) {
    if (req.params.s3bucket) return next();
    req.params.s3bucket = [process.env.APP_NAME, req.params.user, req.params.repo].join('.');
    next();
}

router.use(GithubAuth());

router.get('/formList', getFormlist);

router.route('/submission')
    .all(FormSubmissionMiddleware())
    .post(ProcessSubmission())
    .post(addS3bucket)
    .post(SaveMedia())
    .post(saveForm);

module.exports = router;
