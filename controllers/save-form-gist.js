// Saves a file to a gist

var Octokat = require('octokat')
var Gistfs = require('gistfs.js')
var auth = require('basic-auth')
var debug = require('debug')('simple-odk:save-form-gist')

function saveForm (req, res, next) {
  var submission = req.submission
  var filename = submission.formId + '.geojson'
  var user = auth(req)
  var featureCollection

  var octo = new Octokat({
    username: user.name,
    password: user.pass
  })

  var gistfs = new Gistfs(octo.gists(req.params.gist_id))

  gistfs.readFile(filename, { encoding: 'utf8' }, function (err, data) {
    if (err) {
      featureCollection = {
        type: 'FeatureCollection',
        features: []
      }
    } else {
      try {
        featureCollection = JSON.parse(data)
      } catch (e) {
        return next(new Error('Cannot parse gist json'))
      }
    }
    featureCollection.features.push(submission.json)
    gistfs.writeFile(filename, JSON.stringify(featureCollection, null, '  '), function (err) {
      if (err) return next(err)
      debug('saved form response %s to gist %s', filename, req.params.gist_id)
      res.status(201).end()
    })
  })
}

module.exports = saveForm
