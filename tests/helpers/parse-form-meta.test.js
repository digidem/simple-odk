var test = require('tape');
var parseFormMeta = require('../../helpers/parse-form-meta');
var request = require('request');

var xmlStream = request('https://opendatakit.appspot.com/formXml?formId=Birds');

test('description', function(t) {
  parseFormMeta(xmlStream, function(err, meta) {
    t.end();
  });
});
