// All configuration variables are from environment variables

module.exports = {
    s3key: process.env.S3_KEY,
    s3secret: process.env.S3_SECRET,
    maxContentLength: process.env.MAX_CONTENT_LENGTH || 10485760
};
