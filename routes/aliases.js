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
var debug = require('debug')('simple-odk:aliases')

var checkConfig = require('../helpers/check-config')

var formStores = {
  github: require('./github'),
  firebase: require('./firebase'),
  gist: require('./gist')
}

var DEFAULT_S3_BUCKET = process.env.S3_BUCKET

var aliasConfig = {}

// Read domain config from a file if the environment variable is not set
// (used for local testing)
if (process.env.ALIASES) {
  // TODO: This is a hack to work around escaped strings problems
  // stored in env variables. May cause problems in the future, look out!
  try {
    aliasConfig = JSON.parse(process.env.ALIASES.replace(/\\/g, ''))
  } catch (e) {
    console.error('Problem parsing ALIASES env variable', e.message)
  }
} else {
  try {
    aliasConfig = require('../alias-config')
  } catch (e) {
    console.info('No valid alias config found')
  }
}

// Set up a route for each domain
for (var alias in aliasConfig) {
  checkConfig(aliasConfig[alias], '/' + alias)
}

router.use(function (req, res, next) {
  var config = aliasConfig[req.params.alias]
  debug('request on alias', req.params.alias)
  if (!config) return res.sendStatus(404)

  config.s3bucket = config.s3bucket || DEFAULT_S3_BUCKET

  extend(req.params, config)

  formStores[config.formStore](req, res, next)
})

module.exports = router
