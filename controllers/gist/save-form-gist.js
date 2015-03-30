// Saves a file to a gist

var Gistfs = require('gistfs.js')
var auth = require('basic-auth')
var debug = require('debug')('simple-odk:save-form-gist')

function saveForm (req, res, next) {
  var submission = req.submission
  var filename = submission.formId + '.geojson'
  var user = auth(req)
  var featureCollection

  var gistfs = new Gistfs({
    gistId: req.params.gist_id,
    auth: {
      username: user.name,
      password: user.pass
    }
  })

  gistfs.readFile(filename, { encoding: 'utf8' }, function (err, data) {
    if (err) {
      featureCollection = {
        type: 'FeatureCollection',
        features: []
      }
      debug('creating new geojson feature collection', filename)
    } else {
      try {
        featureCollection = JSON.parse(data)
        debug('appending to existing feature collection', filename)
      } catch (e) {
        return next(new Error('Cannot parse gist json'))
      }
    }
    featureCollection.features.push(submission.json)
    gistfs.writeFile(filename, JSON.stringify(featureCollection, null, '  '), function (err) {
      if (err) return next(err)
      debug('saved form response %s to gist %s', filename, req.params.gist_id)
      res.status(201).send({
        saved: filename
      })
    })
  })
}

module.exports = saveForm
