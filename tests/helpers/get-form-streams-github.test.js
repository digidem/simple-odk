var test = require('tape');
var getFormsGithub = require('../../helpers/get-forms-github');
var Octokat = require('octokat');

var octo = new Octokat();

var repo = octo.repos('digidem-test', 'xform-test');

test('Gets list of form urls from Github', function(t) {
  var expected = require('../fixtures/formlist-github.json').array;

  getFormsGithub(repo, function(err, data) {
    t.error(err, 'no error');
    t.deepEqual(data.sort(), expected.sort(), 'Results match');
    t.end();
  });
});
