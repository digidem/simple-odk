var test = require('tape')
var dotenv = require('dotenv')
var getFormUrls = require('../../helpers/get-form-urls-github.js')

dotenv.load()

var options = {
  user: 'digidem-test',
  repo: 'xform-test',
  headers: {
    'User-Agent': 'simple-odk'
  },
  auth: {
    name: process.env.GITHUB_TOKEN,
    pass: 'x-oauth-basic'
  },
  baseUrl: 'https://example.com/forms'
}

test('Returns expected list of urls from Github repo', function (t) {
  var expectedUrls = require('../fixtures/formlist-github').array
  getFormUrls(options, function (err, urls) {
    t.error(err, 'does not throw err')
    t.deepEqual(urls, expectedUrls, 'returned array matches fixture')
    t.end()
  })
})
