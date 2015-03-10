var test = require('tape');
var request = require('supertest');
var express = require('express');
var saveForm = require('../../controllers/get-formlist-github');
var extend = require('xtend/mutable');
var dotenv = require('dotenv');
var fs = require('fs');
var app = express();

dotenv.load();

// Mock the req
function mockReq(req, res, next) {
  extend(req, require('../fixtures/req-github'));
  next();
}

app.get('/', mockReq, saveForm);

var expected = fs.readFileSync(__dirname + '/../fixtures/formlist.xml').toString().replace(/\n$/, '');

request(app).get('/')
  .auth(process.env.GITHUB_TOKEN, 'x-oauth-basic')
  .expect(200, expected)
  .end(function(err, res) {
    console.log(err);
  });
