var test = require('tape')
var updateFileRef = require('../../helpers/update-file-ref')

var form = require('../fixtures/form-media')

var file = {
  originalFilename: '123456789.jpg',
  url: 'http://example.com/images/123456789.jpg'
}

test('Updates form replacing the filename with url and original filename', function (t) {
  var expected = require('../fixtures/form-media-updated.json')
  updateFileRef(form, file)
  t.deepEqual(form, expected, 'form matches expected')
  t.end()
})
