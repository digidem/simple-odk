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

test('Returns status 201', function (t) {
  var app = express()

  gistfsStubs = {
    readFile: function (filename, options, callback) {
      callback(new Error())
    },
    writeFile: function (filename, data, callback) {
      var expected = {
        type: 'FeatureCollection',
        features: [
          submission.submission.json
        ]
      }
      test('Calls hubfs.writeFile with correct args', function (t) {
        t.equal(filename, 'abcd.geojson')
        t.deepEqual(JSON.parse(data), expected)
        t.end()
      })
      callback(null)
    }
  }

  var saveForm = proxyquire('../../controllers/gist/save-form-gist', stubs)

  app.get('/', mockReq, saveForm)

  request(app)
    .get('/')
    .auth('test', 'test')
    .expect(201, t.end)
})

test('Returns status 201', function (t) {
  var app = express()

  gistfsStubs = {
    readFile: function (filename, options, callback) {
      callback(null, JSON.stringify(require('../fixtures/single-geojson')))
    },
    writeFile: function (filename, data, callback) {
      var expected = require('../fixtures/single-geojson')
      expected.features.push(submission.submission.json)
      test('Calls hubfs.writeFile with correct args', function (t) {
        t.equal(filename, 'abcd.geojson')
        t.deepEqual(JSON.parse(data), expected)
        t.end()
      })
      callback(null)
    }
  }

  var saveForm = proxyquire('../../controllers/gist/save-form-gist', stubs)

  app.get('/', mockReq, saveForm)

  request(app)
    .get('/')
    .auth('test', 'test')
    .expect(201, t.end)
})
