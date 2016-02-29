var test = require('tape')
var request = require('supertest')
var express = require('express')
var proxyquire = require('proxyquire').noPreserveCache()
var extend = require('xtend/mutable')
var fs = require('fs')
var path = require('path')
var dotenv = require('dotenv')

var app = express()

dotenv.load()

var auth = {
  name: process.env.GIST_TOKEN,
  pass: 'x-oauth-basic'
}

// Mock the req
function mockReq (req, res, next) {
  extend(req, require('../fixtures/req-gist.json'))
  next()
}

var formlistXml = fs.readFileSync(path.join(__dirname, '/../fixtures/formlist-birds.xml')).toString().trim()

var stubs = {
  'octokat': function () {
    return {
      gists: function () {
        return {
          fetch: function (callback) {
            callback(null, require('../fixtures/test-gist.json'))
          }
        }
      }
    }
  }
}

var getFormlist = proxyquire('../../controllers/gist/get-formlist-gist', stubs)

app.get('/', mockReq, getFormlist)

test('Request to formlist returns valid content-type', function (t) {
  request(app).get('/')
    .set('Host', 'example.com')
    .auth(auth.name, auth.pass)
    .expect('content-type', 'text/xml; charset=utf-8')
    .end(t.end)
})

test('Request to formlist returns expected formlist Xml', function (t) {
  request(app).get('/')
    .set('Host', 'example.com')
    .auth(auth.name, auth.pass)
    .expect(200, formlistXml)
    .end(t.end)
})
