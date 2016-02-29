var test = require('tape')
var request = require('supertest')
var express = require('express')
var proxyquire = require('proxyquire').noPreserveCache()
var extend = require('xtend/mutable')
var fs = require('fs')
var path = require('path')
var app = express()

// Mock the req
function mockReq (req, res, next) {
  extend(req, require('../fixtures/req-github'))
  next()
}

var formUrls = require('../fixtures/formlist-github').array
var formlistXml = fs.readFileSync(path.join(__dirname, '/../fixtures/formlist.xml')).toString().trim()

var stubs = {
  '../../helpers/get-form-urls-github': function (options, callback) {
    callback(null, formUrls)
  },
  'openrosa-formlist': function (formUrls, options, callback) {
    callback(null, formlistXml)
  }
}

var getFormlist = proxyquire('../../controllers/github/get-formlist-github', stubs)

app.get('/', mockReq, getFormlist)

test('Request to formlist returns valid content-type', function (t) {
  request(app).get('/')
    .expect('content-type', 'text/xml; charset=utf-8')
    .end(t.end)
})

test('Request to formlist returns expected formlist Xml', function (t) {
  request(app).get('/')
    .expect(200, formlistXml)
    .end(t.end)
})

test('Calls internal modules with correct options', function (t) {
  var stubs2 = {
    '../../helpers/get-form-urls-github': function (options, callback) {
      t.test('- Calls getFormUrls with the correct options', function (st) {
        st.equal(options.user, 'digidem-test')
        st.equal(options.repo, 'xform-test')
        st.equal(options.headers['User-Agent'], 'simple-odk')
        st.equal(options.baseUrl, 'https://example.com/forms')
        st.end()
      })
      callback(null, formUrls)
    },
    'openrosa-formlist': function (formUrls, options, callback) {
      t.test('- Calls formlist with the correct options', function (st) {
        st.equal(options.auth.user, 'username')
        st.equal(options.auth.pass, 'password')
        st.deepEqual(options.headers, { 'User-Agent': 'simple-odk' })
      })
      callback(null, formlistXml)
    }
  }
  var app = express()
  var getFormlist = proxyquire('../../controllers/github/get-formlist-github', stubs2)
  app.get('/', mockReq, getFormlist)

  request(app).get('/')
    .auth('username', 'password')
    .set('Host', 'example.com')
    .set('Host', 'example.com')
    .expect(200, t.end)
})
