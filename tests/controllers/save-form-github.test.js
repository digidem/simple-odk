var test = require('tape')
var proxyquire = require('proxyquire')
var request = require('supertest')
var express = require('express')
var extend = require('xtend/mutable')

var app = express()

var submission = require('../fixtures/req-submission')

// Mock the req
function mockReq (req, res, next) {
  extend(req, require('../fixtures/req-github'))
  extend(req, submission)
  next()
}

test('Calls hubfs.writeFile with correct args', function (t) {
  // stub out hubfs
  var stubs = {
  'hubfs.js': function () {
    return {
      writeFile: function (filename, data, options, callback) {
        t.equal(filename, 'submissions/abcd/efgh.geojson', 'filename is correct')
        t.deepEqual(JSON.parse(data), submission.submission.json, 'geojson matches expected')
        t.equal(options.message, 'Added new form response submissions/abcd/efgh.geojson', 'correct commit message')
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
