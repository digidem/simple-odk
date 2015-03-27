/**
 * This is used for default routes for specific custom installs of simple-odk
 * on different domains. Eg. `https://odk.example.com/` can be an alias of
 * `https://simpleodk.org/gh/username/repo`
 * Configuration is via an environment variable VHOSTS which is JSON
 * with the virtual domains as keys.
 * Going to depreciate this functionality, just in place until we can switch
 * the config on phones using ODK.
 * @example
 * VHOSTS = {
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
var extend = require('xtend/mutable')

var checkConfig = require('../helpers/check-config')

var formStores = {
  github: require('./github'),
  firebase: require('./firebase'),
  gist: require('./gist')
}

var DEFAULT_S3_BUCKET = process.env.S3_BUCKET

var vhostConfig

// Read domain config from a file if the environment variable is not set
// (used for local testing)
if (process.env.VHOSTS) {
  // TODO: This is a hack to work around escaped strings problems
  // stored in env variables. May cause problems in the future, look out!
  try {
    vhostConfig = JSON.parse(process.env.VHOSTS.replace(/\\/g, ''))
  } catch (e) {
    console.error('Problem parsing VHOST env variable', e.message)
    vhostConfig = {}
  }
} else {
  try {
    vhostConfig = require('../vhost-config')
  } catch (e) {
    console.log('No valid vhost config found')
    vhostConfig = {}
  }
}

// Set up a route for each domain
for (var domain in vhostConfig) {
  setupRoute(domain, vhostConfig[domain])
}

function setupRoute (domain, config) {
  try {
    checkConfig(config)
    config.s3bucket = config.s3bucket || DEFAULT_S3_BUCKET
    router.use(vhost(domain, function (req, res, next) {
      extend(req.params, config)
      formStores[config.formStore](req, res, next)
    }))
  } catch (e) {
    console.error(e.message)
  }
}

module.exports = router
