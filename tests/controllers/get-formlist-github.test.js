var test = require('tape');
var request = require('supertest');
var express = require('express');
var proxyquire = require('proxyquire').noPreserveCache();
var extend = require('xtend/mutable');
var fs = require('fs');
var app = express();

// Mock the req
function mockReq(req, res, next) {
  extend(req, require('../fixtures/req-github'));
  next();
}

var formUrls = require('../fixtures/formlist-github').array;
var formlistXml = fs.readFileSync(__dirname + '/../fixtures/formlist.xml').toString().trim();

var stubs = {
  '../helpers/get-form-urls-github': function(options, callback) {
    test('Calls formlist with the correct options', function(t) {
      t.equal(options.user, 'digidem-test');
      t.equal(options.repo, 'xform-test');
      t.equal(options.headers['User-Agent'], 'simple-odk');
      t.end();
    });
    callback(null, formUrls);
  },
  'openrosa-formlist': function(formUrls, options, callback) {
    callback(null, formlistXml);
  }
};

var getFormlist = proxyquire('../../controllers/get-formlist-github', stubs);

app.get('/', mockReq, getFormlist);

test('Request to formlist returns valid content-type', function(t) {
  request(app).get('/')
    .expect('content-type', 'text/xml; charset=utf-8')
    .end(t.end);
});

test('Request to formlist returns expected formlist Xml', function(t) {
  request(app).get('/')
    .expect(200, formlistXml)
    .end(t.end);
});
