var test = require('tape')
var proxyquire = require('proxyquire')
var request = require('supertest')
var express = require('express')
var extend = require('xtend/mutable')

var app = express()

var submission = require('../fixtures/req-submission.json')

var reqGithub = require('../fixtures/req-github.json')

// Mock the req
function mockReq (req, res, next) {
  extend(req, reqGithub)
  extend(req, submission)
  next()
}

test('Calls hubfs.writeFile with correct args', function (t) {
  // stub out hubfs
  var stubs = {
    'hubfs.js': function (options) {
      t.equal(options.owner, reqGithub.params.user)
      t.equal(options.repo, reqGithub.params.repo)
      t.equal(options.auth.username, 'test')
      t.equal(options.auth.password, 'test')
      return {
        readFile: function (filename, options, callback) {
          // Stub returns error to simulate file not existing
          callback(new Error())
        },
        writeFile: function (filename, data, options, callback) {
          var expected = {
            type: 'FeatureCollection',
            features: [
              submission.submission.json
            ]
          }
          t.equal(filename, 'submissions/abcd.geojson', 'filename is correct')
          t.deepEqual(JSON.parse(data), expected, 'geojson matches expected')
          t.equal(options.message, 'Added new form response submissions/abcd.geojson', 'correct commit message')
          t.equal(options.branch, 'master', 'writes to correct branch')
          callback(null, {
            filename: filename,
            data: data,
            options: options
          })
        }
      }
    }
  }

  var saveForm = proxyquire('../../controllers/github/save-form-github', stubs)

  app.get('/', mockReq, saveForm)

  request(app)
    .get('/')
    .auth('test', 'test')
    .expect(201, t.end)
})

test('Appends geojson feature to existing feature collection in gist', function (t) {
  var app = express()

  var stubs = {
    'hubfs.js': function (options) {
      return {
        readFile: function (filename, options, callback) {
          // Read file returns Feature Collection, reflecting geojson already exists in gist
          callback(null, JSON.stringify(require('../fixtures/single-geojson.json')))
        },
        writeFile: function (filename, data, options, callback) {
          var expected = require('../fixtures/single-geojson.json')
          expected.features.push(submission.submission.json)
          t.equal(filename, 'submissions/abcd.geojson', 'filename is correct')
          t.deepEqual(JSON.parse(data), expected, 'updates existing geojson feature collection')
          callback(null, {
            filename: filename,
            data: data,
            options: options
          })
        }
      }
    }
  }

  var saveForm = proxyquire('../../controllers/github/save-form-github', stubs)

  app.post('/', mockReq, saveForm)

  request(app)
    .post('/')
    .auth('test', 'test')
    .expect(201, t.end)
})
