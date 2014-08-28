// All configuration variables are from environment variables

module.exports = {
    mediaStore: process.env.MEDIA_STORE ? process.env.MEDIA_STORE.toLowerCase() : "fs",
    formStore: process.env.FORM_STORE ? process.env.FORM_STORE.toLowerCase() : "fs",
    github: {
        user: process.env.GITHUB_USER,
        repo: process.env.GITHUB_REPO,
        branch: process.env.GITHUB_BRANCH || "master"
    },
    s3: {
        bucket: process.env.S3_BUCKET,
        key: process.env.S3_KEY,
        secret: process.env.S3_SECRET
    },
    filesystem: {
        path: process.env.FILE_PATH || __dirname + "/form_data"
    },
    formServer: process.env.FORM_SERVER || "https://raw.githubusercontent.com/" +
        process.env.GITHUB_USER + "/" +
        process.env.GITHUB_REPO + "/" +
        (process.env.GITHUB_BRANCH || "master") + "/forms/",
    acceptContentLength: process.env.ACCEPT_CONTENT_LENGTH || 10485760
};