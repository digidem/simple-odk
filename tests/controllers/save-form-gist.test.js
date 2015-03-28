var test = require('tape')
var proxyquire = require('proxyquire')
var request = require('supertest')
var express = require('express')
var extend = require('xtend/mutable')

var submission = require('../fixtures/req-submission')

// Mock the req
function mockReq (req, res, next) {
  extend(req, require('../fixtures/req-github'))
  extend(req, submission)
  next()
}

var gistfsStubs = {}

// stub out gistfs
var stubs = {
  octokat: function () {
    return {
      gists: function () {}
    }
  },
  'gistfs.js': function () {
    return gistfsStubs
  }
}

test('Creates a new geojson feature collection if none exists in gist', function (t) {
  var app = express()

  gistfsStubs = {
    readFile: function (filename, options, callback) {
      // Stub returns error to simulate file not existing
      callback(new Error())
    },
    writeFile: function (filename, data, callback) {
      var expected = {
        type: 'FeatureCollection',
        features: [
          submission.submission.json
        ]
      }
      t.equal(filename, 'abcd.geojson', 'filename is correct')
      t.deepEqual(JSON.parse(data), expected, 'saves correct geojson feature collection')
      callback(null)
    }
  }

  var saveForm = proxyquire('../../controllers/gist/save-form-gist', stubs)

  app.post('/', mockReq, saveForm)

  request(app)
    .post('/')
    .auth('test', 'test')
    .expect(201, t.end)
})

test('Appends geojson feature to existing feature collection in gist', function (t) {
  var app = express()

  gistfsStubs = {
    readFile: function (filename, options, callback) {
      // Read file returns Feature Collection, reflecting geojson already exists in gist
      callback(null, JSON.stringify(require('../fixtures/single-geojson')))
    },
    writeFile: function (filename, data, callback) {
      var expected = require('../fixtures/single-geojson')
      expected.features.push(submission.submission.json)
      t.equal(filename, 'abcd.geojson', 'filename is correct')
      t.deepEqual(JSON.parse(data), expected, 'updates existing geojson feature collection')
      callback(null)
    }
  }

  var saveForm = proxyquire('../../controllers/gist/save-form-gist', stubs)

  app.post('/', mockReq, saveForm)

  request(app)
    .post('/')
    .auth('test', 'test')
    .expect(201, t.end)
})
