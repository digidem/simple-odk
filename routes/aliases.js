/**
 * This is used for default routes for short aliases. Eg.
 * `https://collekt.org/myname` can be an alias of
 * `https://simpleodk.org/gh/username/repo` Configuration is via an
 * environment variable ALIASES which is JSON with the aliases as keys.
 * @example
 * ALIASES = {
 *   "shortname": {
 *     "formStore": "github",
 *     "githubUser": "username",
 *     "githubRepo": "reponame"
 *   },
 *   "bananas": {
 *     "formStore": "firebase",
 *     "appname": "firebase_app_name"
 *   }
 * }
 */
var router = require('express').Router({ mergeParams: true })
var extend = require('xtend/mutable')

var checkConfig = require('../helpers/check-config')

var formStores = {
  github: require('./github'),
  firebase: require('./firebase'),
  gist: require('./gist')
}

var DEFAULT_S3_BUCKET = process.env.S3_BUCKET

var aliasConfig

// Read domain config from a file if the environment variable is not set
// (used for local testing)
if (process.env.ALIASES) {
  // TODO: This is a hack to work around escaped strings problems
  // stored in env variables. May cause problems in the future, look out!
  aliasConfig = JSON.parse(process.env.ALIASES.replace(/\\/g, ''))
} else {
  aliasConfig = require('../alias-config')
}

// Set up a route for each domain
for (var alias in aliasConfig) {
  setupRoute(alias, aliasConfig[alias])
}

function setupRoute (alias, config) {
  try {
    checkConfig(config)
    config.s3bucket = config.s3bucket || DEFAULT_S3_BUCKET
    router.use('/' + alias, function (req, res, next) {
      extend(req.params, config)
      formStores[config.formStore](req, res, next)
    })
  } catch (e) {
    console.error(e.message)
  }
}

module.exports = router
