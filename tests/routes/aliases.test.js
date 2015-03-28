var test = require('tape')
var request = require('supertest')
var proxyquire = require('proxyquire').noCallThru()
var express = require('express')
var extend = require('xtend')

var app = express()

var aliasConfig = {
  'example-github': {
    formStore: 'github',
    user: 'digidem-test',
    repo: 'xform-test',
    s3bucket: 'mys3bucket'
  },
  'example-gist': {
    formStore: 'gist',
    gist_id: 'mygistid',
    s3bucket: 'mys3bucket'
  },
  'example-fb': {
    formStore: 'firebase',
    appname: 'myappname',
    s3bucket: 'mys3bucket'
  }
}

process.env.ALIASES = JSON.stringify(aliasConfig)

var stubs = {
  './github': express.Router({ mergeParams: true }).use(function (req, res, next) {
    res.send('github')
  }),
  './gist': express.Router({ mergeParams: true }).use(function (req, res, next) {
    res.send('gist')
  }),
  './firebase': express.Router({ mergeParams: true }).use(function (req, res, next) {
    res.send('firebase')
  })
}

var aliases = proxyquire('../../routes/aliases', stubs)

app.use('/:alias', aliases)

test('Routes to Github', function (t) {
  request(app)
    .get('/example-github')
    .expect(200, 'github', t.end)
})

test('Routes to Gist', function (t) {
  request(app)
    .get('/example-gist')
    .expect(200, 'gist', t.end)
})

test('Routes to Firebase', function (t) {
  request(app)
    .get('/example-fb')
    .expect(200, 'firebase', t.end)
})

test('Routes all requests to sub-router', function (t) {
  request(app)
    .get('/example-github/forms')
    .expect(200, 'github', t.end)
})

test('404 for invalid alias', function (t) {
  request(app)
    .get('/invalid-alias')
    .expect(404, t.end)
})

test('Passes correct args to github router', function (t) {
  var testStubs = extend(stubs, {
    './github': express.Router({ mergeParams: true }).get('*', function (req, res, next) {
      t.equal(req.params.user, aliasConfig['example-github'].user)
      t.equal(req.params.repo, aliasConfig['example-github'].repo)
      t.equal(req.params.s3bucket, aliasConfig['example-github'].s3bucket)
      res.send('github')
    })
  })

  var app = express()
  var aliases = proxyquire('../../routes/aliases', testStubs)
  app.use('/:alias', aliases)
  request(app)
    .get('/example-github')
    .expect(200, 'github', t.end)
})

test('Passes correct args to gist router', function (t) {
  var testStubs = extend(stubs, {
    './gist': express.Router({ mergeParams: true }).get('*', function (req, res, next) {
      t.equal(req.params.gist_id, aliasConfig['example-gist'].gist_id)
      t.equal(req.params.s3bucket, aliasConfig['example-gist'].s3bucket)
      res.send('gist')
    })
  })
  var app = express()
  var aliases = proxyquire('../../routes/aliases', testStubs)
  app.use('/:alias', aliases)
  request(app)
    .get('/example-gist')
    .expect(200, 'gist', t.end)
})

test('Passes correct args to firebase router', function (t) {
  var testStubs = extend(stubs, {
    './firebase': express.Router({ mergeParams: true }).get('*', function (req, res, next) {
      t.equal(req.params.appname, aliasConfig['example-fb'].appname)
      t.equal(req.params.s3bucket, aliasConfig['example-fb'].s3bucket)
      res.send('firebase')
    })
  })
  var app = express()
  var aliases = proxyquire('../../routes/aliases', testStubs)
  app.use('/:alias', aliases)
  request(app)
    .get('/example-fb')
    .expect(200, 'firebase', t.end)
})
