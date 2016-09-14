var APP_NAME = process.env.APP_NAME
var S3_BUCKET = process.env.S3_BUCKET

/**
 * Tiny middleware to add an s3 bucket name of the form simple-odk.user.repo
 * AWS user arn:aws:iam::018729244327:user/simple-odk will need `s3:PutObject` and
 * `s3:PutObjectAcl` permissions for the bucket
 */
module.exports = function addS3bucket (req, res, next) {
  if (req.params.s3bucket) return next()
  req.params.s3bucket = S3_BUCKET || [APP_NAME, req.params.user].join('.')
  next()
}
