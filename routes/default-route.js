var github = require('./github');
var debug = require('debug')('simple-odk:default-route');

var config = {
    formStore: process.env.FORM_STORE,
    githubRepo: process.env.GITHUB_REPO,
    githubUser: process.env.GITHUB_USER,
    s3bucket: process.env.S3_BUCKET
};

switch (config.formStore) {
    case 'github':
    if (!config.githubRepo || !config.githubUser) {
        console.error('You must provide GITHUB_USER and GITHUB_REPO env variables');
        module.exports = passthrough;
    } else {
        debug('using Github for default route');
        module.exports = useGithub;
    }
    break;
    default:
    debug('no default route configured');
    module.exports = passthrough;
}

function passthrough(req, res, next) {
    next();
}

function useGithub(req, res, next) {
    req.params.user = config.githubUser;
    req.params.repo = config.githubRepo;
    req.params.s3bucket = config.s3bucket;
    github(req, res, next);
}
