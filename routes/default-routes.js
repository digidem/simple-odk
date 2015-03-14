var router   = require('express').Router();
var vhost    = require('vhost');
var debug    = require('debug')('simple-odk:default-routes');

var github   = require('./github');
var firebase = require('./firebase');
var gist     = require('./gist');

var DEFAULT_S3_BUCKET = process.env.S3_BUCKET;

var domainConfig, config;

if (process.env.DOMAIN_CONFIG) {
    domainConfig = JSON.parse(process.env.DOMAIN_CONFIG);
} else {
    domainConfig = require('./domain-config');
}

for (var domain in domainConfig) {
    setupRoute(domain, domainConfig[domain]);
}

function setupRoute(domain, config) {

    switch (config.formStore) {
        case 'github':
        if (!config.githubRepo || !config.githubUser) {
            console.error('You must provide `githubRepo` and `githubUser` in domain config');
        } else {
            debug('using Github repo %s for %s', config.githubUser + '/' + config.githubRepo, domain);
            router.use(vhost(domain, useGithub));
        }
        break;

        case 'firebase':
        if (!config.appname) {
            console.error('You must provide a firebase `appname` in domain config');
        } else {
            debug('using Firebase app % for %s', config.appname, domain);
            router.use(vhost(domain, useFirebase));
        }
        break;

        case 'gist':
        if (!config.gist_id) {
            console.error('You must provide a Gist `gist_id` in domain config');
        } else {
            debug('using Gist id %s for %s', config.gist_id, domain);
            router.use(vhost(domain, useGist));
        }

        default:
        debug('no default route configured');
        router.use(function(req, res, next) {
            next();
        });
    }

    function useGithub(req, res, next) {
        req.params.user = config.githubUser;
        req.params.repo = config.githubRepo;
        req.params.s3bucket = config.s3bucket || DEFAULT_S3_BUCKET;
        github(req, res, next);
    }

    function useFirebase(req, res, next) {
        req.params.appname = config.appname;
        req.params.s3bucket = config.s3bucket || DEFAULT_S3_BUCKET;
        firebase(req, res, next);
    }

    function useGist(req, res, next) {
        req.params.gist_id = config.gist_id;
        req.params.s3bucket = config.s3bucket || DEFAULT_S3_BUCKET;
        gist(req, res, next);
    }
}

module.exports = router;

