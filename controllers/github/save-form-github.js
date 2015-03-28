// Saves a file to github

var Octokat = require('octokat')
var Hubfs = require('hubfs.js')
var queue = require('async').queue
var basicAuth = require('basic-auth')
var debug = require('debug')('simple-odk:save-form-github')

var defaults = {
  branch: 'master'
}

var queues = {}

function saveForm (req, res, next) {
  var submission = req.submission
  var ext = submission.geojson ? '.geojson' : '.json'

  var task = {
    user: req.params.user,
    repo: req.params.repo,
    filename: 'submissions/' + submission.formId + '/' + submission.instanceId + ext,
    json: JSON.stringify(submission.json, null, '  '),
    auth: basicAuth(req)
  }

  var id = task.user + '/' + task.repo

  // Create a new queue for each repo, so that we only save files to github
  // one at a time, to avoid problems with fast-forwards
  var q = queues[id] = queues[id] || queue(saveToGithub, 1)

  // // allow this queue to be garbage collected once it is empty
  // q.drain = function () {
  //   delete queues[id]
  // }

  q.push(task, function (err, task) {
    if (err) return next(err)
    debug('saved form response %s to github repo %s', task.filename, task.user + '/' + task.repo)
    res.status(201).send({ saved: task.filename })
  })
}

function saveToGithub (task, callback) {
  var octo = new Octokat({
    username: task.auth.name,
    password: task.auth.pass
  })

  var writeOptions = {
    message: 'Added new form response ' + task.filename,
    branch: defaults.branch
  }

  var hubfs = new Hubfs(octo.repos(task.user, task.repo))

  hubfs.writeFile(task.filename, task.json, writeOptions, function (err) {
    if (err) return callback(err)
    callback(null, task)
  })
}

module.exports = saveForm
