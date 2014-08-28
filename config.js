module.exports = {
    mediaStore: process.env.MEDIA_STORE,
    formStore: process.env.FORM_STORE,
    github: {
        user: process.env.GITHUB_USER,
        repo: process.env.GITHUB_REPO,
        branch: process.env.GITHUB_BRANCH
    },
    s3: {
        bucket: process.env.S3_BUCKET,
        key: process.env.S3_KEY,
        secret: process.env.S3_SECRET
    },
    filesystem: {
        path: process.env.FILE_PATH
    },
    formServer: process.env.FORM_SERVER
};