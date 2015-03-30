// Saves a file to github

var Hubfs = require('hubfs.js')
var extend = require('xtend')
var basicAuth = require('basic-auth')
var debug = require('debug')('simple-odk:save-form-github')

var defaults = {
  branch: 'master'
}

function saveForm (req, res, next) {
  var submission = req.submission
  var user = req.params.user
  var repo = req.params.repo
  var ext = submission.geojson ? '.geojson' : '.json'
  var filename = 'submissions/' + submission.formId + '/' + submission.instanceId + ext
  var json = JSON.stringify(submission.json, null, '  ')
  var auth = basicAuth(req)
  var options = extend(defaults, options)

  var writeOptions = {
    message: 'Added new form response ' + filename,
    branch: options.branch
  }

  var hubfs = new Hubfs({
    owner: user,
    repo: repo,
    auth: {
      username: auth.name,
      password: auth.pass
    }
  })

  hubfs.writeFile(filename, json, writeOptions, function (err) {
    if (err) return next(err)
    debug('saved form response %s to github repo %s', filename, user + '/' + repo)
    res.status(201).send({
      saved: filename
    })
  })
}

module.exports = saveForm
