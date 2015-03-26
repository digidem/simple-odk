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

// stub out hubfs
var stubs = {
  'hubfs.js': function () {
    return {
      writeFile: function (filename, data, options, callback) {
        test('Calls hubfs.writeFile with correct args', function (t) {
          t.equal(filename, 'submissions/abcd/efgh.geojson')
          t.equal(data, JSON.stringify(submission.submission.json, null, '  '))
          t.equal(options.message, 'Added new form response submissions/abcd/efgh.geojson')
          t.equal(options.branch, 'master')
          t.end()
        })
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

test('Returns status 201', function (t) {
  request(app)
    .get('/')
    .auth('test', 'test')
    .expect(201, t.end)
})
