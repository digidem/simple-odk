var test = require('tape')
var request = require('supertest')
var express = require('express')
var proxyquire = require('proxyquire')
var extend = require('xtend/mutable')

var app = express()

var stubs = {
  '../../helpers/proxy-content-type': function (url, res, options) {
    res.set('content-type', options.contentType)
    res.send(url)
  }
}

var getForm = proxyquire('../../controllers/github/get-form-github', stubs)

// Mock the req
function mockReq (req, res, next) {
  extend(req, require('../fixtures/req-github.json'))
  req.params.blob_sha = 'abcdef'
  next()
}

app.get('/', mockReq, getForm)

test('Proxies get form request with content type', function (t) {
  request(app)
    .get('/')
    .expect('content-type', 'text/xml; charset=utf-8')
    .expect('https://api.github.com/repos/digidem-test/xform-test/git/blobs/abcdef', t.end)
})
