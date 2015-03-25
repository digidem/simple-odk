var basicAuth = require('basic-auth');
var getCharset = require('charset');
var request = require('request');

module.exports = function(req, res) {
  var auth = basicAuth(req);

  var options = {
    headers: {
      'User-Agent': 'simple-odk',
      'Accept': 'application/vnd.github.v3.raw'
    }
  };

  if (auth) {
    options.auth = {
      user: auth.name,
      pass: auth.pass
    };
  }

  var formUrl = 'https://api.github.com/repos/' + req.params.user + '/' +
    req.params.repo + '/git/blobs/' + req.params.blob_sha;

  request.get(formUrl, options).on('response', function(incoming) {
    // If the upstream server served this file with a specific character
    // encoding, so should we.
    var charset = getCharset(incoming.headers['content-type']),
        type = 'text/xml';
    if (charset) type += '; charset=' + charset;

    // We need to correct the content type on proxied formLists from Github, which are served
    // as text/plain by default, which ODK Collect does not like.
    incoming.headers['content-type'] = type;
    res.writeHead(incoming.statusCode, incoming.headers);
    incoming.pipe(res);
  })
  .on('error', function(err) {
      console.log(err);
      res.statusCode(500).send('Problem connecting to form server');
  });
};
