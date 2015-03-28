var test = require('tape')
var request = require('supertest')
var proxyquire = require('proxyquire').noCallThru()
var express = require('express')

var vhostConfig = {
  'github.example.com': {
    formStore: 'github',
    user: 'digidem-test',
    repo: 'xform-test',
    s3bucket: 'mys3bucket'
  },
  'gist.example.com': {
    formStore: 'gist',
    gist_id: 'mygistid',
    s3bucket: 'mys3bucket'
  },
  'fb.example.com': {
    formStore: 'firebase',
    appname: 'myappname',
    s3bucket: 'mys3bucket'
  }
}

process.env.VHOSTS = JSON.stringify(vhostConfig)

function createStubs (t) {
  return {
    './github': express.Router({ mergeParams: true }).get('/', function (req, res, next) {
      t.equal(req.params.user, vhostConfig['github.example.com'].user)
      t.equal(req.params.repo, vhostConfig['github.example.com'].repo)
      t.equal(req.params.s3bucket, vhostConfig['github.example.com'].s3bucket)
      res.send('github')
    }),
    './gist': express.Router({ mergeParams: true }).get('/', function (req, res, next) {
      t.equal(req.params.gist_id, vhostConfig['gist.example.com'].gist_id)
      t.equal(req.params.s3bucket, vhostConfig['gist.example.com'].s3bucket)
      res.send('gist')
    }),
    './firebase': express.Router({ mergeParams: true }).get('/', function (req, res, next) {
      t.equal(req.params.appname, vhostConfig['fb.example.com'].appname)
      t.equal(req.params.s3bucket, vhostConfig['fb.example.com'].s3bucket)
      res.send('firebase')
    })
  }
}

test('Routes to Github passing correct params', function (t) {
  var app = express()
  var vhosts = proxyquire('../../routes/vhosts', createStubs(t))
  app.use('/', vhosts)
  request(app)
    .get('/')
    .set('Host', 'github.example.com')
    .expect(200, 'github')
    .end(t.end)
})

test('Routes to Gist passing correct params', function (t) {
  var app = express()
  var vhosts = proxyquire('../../routes/vhosts', createStubs(t))
  app.use('/', vhosts)
  request(app)
    .get('/')
    .set('Host', 'gist.example.com')
    .expect(200, 'gist', t.end)
})

test('Routes to Firebase passing correct params', function (t) {
  var app = express()
  var vhosts = proxyquire('../../routes/vhosts', createStubs(t))
  app.use('/', vhosts)
  request(app)
    .get('/')
    .set('Host', 'fb.example.com')
    .expect(200, 'firebase', t.end)
})
