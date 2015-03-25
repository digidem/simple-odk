/**
 * This is used for default routes for specific custom installs of simple-odk
 * on different domains. Eg. `https://odk.example.com/` can be an alias of
 * `https://simpleodk.org/gh/username/repo`
 * Configuration is via an environment variable DOMAIN_CONFIG which is JSON
 * with the virtual domains as keys.
 * Going to depreciate this functionality, just in place until we can switch
 * the config on phones using ODK.
 * @example
 * DOMAIN_CONFIG = {
 *   "odk.example.com": {
 *     "formStore": "github",
 *     "githubUser": "username",
 *     "githubRepo": "reponame"
 *   },
 *   "odk.myserver.com": {
 *     "formStore": "firebase",
 *     "appname": "firebase_app_name"
 *   }
 * }
 */
var router = require('express').Router()
var vhost = require('vhost')
var debug = require('debug')('simple-odk:default-routes')

var github = require('./github')
var firebase = require('./firebase')
var gist = require('./gist')

var DEFAULT_S3_BUCKET = process.env.S3_BUCKET

var domainConfig

// Read domain config from a file if the environment variable is not set
// (used for local testing)
if (process.env.DOMAIN_CONFIG) {
  domainConfig = JSON.parse(process.env.DOMAIN_CONFIG)
} else {
  domainConfig = require('../domain-config')
}

// Set up a route for each domain
for (var domain in domainConfig) {
  setupRoute(domain, domainConfig[domain])
}

function setupRoute (domain, config) {
  switch (config.formStore) {
    case 'github':
      if (!config.githubRepo || !config.githubUser) {
        console.error('You must provide `githubRepo` and `githubUser` in domain config')
      } else {
        debug('using Github repo %s for %s', config.githubUser + '/' + config.githubRepo, domain)
        router.use(vhost(domain, useGithub))
      }
      break

    case 'firebase':
      if (!config.appname) {
        console.error('You must provide a firebase `appname` in domain config')
      } else {
        debug('using Firebase app % for %s', config.appname, domain)
        router.use(vhost(domain, useFirebase))
      }
      break

    case 'gist':
      if (!config.gist_id) {
        console.error('You must provide a Gist `gist_id` in domain config')
      } else {
        debug('using Gist id %s for %s', config.gist_id, domain)
        router.use(vhost(domain, useGist))
      }
      break

    default:
      debug('no default route configured')
      // Passthrough function if no recognized `formStore` is defined
      router.use(function (req, res, next) {
        next()
      })
  }

  // Adds req params for user, repo + s3bucket if using github
  function useGithub (req, res, next) {
    req.params.user = config.githubUser
    req.params.repo = config.githubRepo
    req.params.s3bucket = config.s3bucket || DEFAULT_S3_BUCKET
    github(req, res, next)
  }

  // Add req params for firebase appname + s3bucket if using firebase
  function useFirebase (req, res, next) {
    req.params.appname = config.appname
    req.params.s3bucket = config.s3bucket || DEFAULT_S3_BUCKET
    firebase(req, res, next)
  }

  // Add req params for gist_id + s3bucket if using gist
  function useGist (req, res, next) {
    req.params.gist_id = config.gist_id
    req.params.s3bucket = config.s3bucket || DEFAULT_S3_BUCKET
    gist(req, res, next)
  }
}

module.exports = router
