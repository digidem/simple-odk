module.exports = {
    mediaStore: process.env.MEDIA_STORE,
    formStore: process.env.FORM_STORE,
    github: {
        user: process.env.GITHUB_USER,
        repo: process.env.GITHUB_REPO,
        branch: process.env.GITHUB_BRANCH
    },
    s3: {
        bucket: process.env.S3_BUCKET
    },
    filesystem: {
        path: process.env.FILE_PATH
    },
    formServer: process.env.FORM_SERVER
};