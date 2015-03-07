/**
 * Proxies a request for a formlist to github ensuring it returns the correct
 * content-type headers
 */
var getCharset = require('charset');
var request = require('request');

module.exports = function(req, res) {
    var url = 'https://raw.githubusercontent.com/' +
                req.params.user + '/' +
                req.params.repo + '/master/forms/formList';

    res.setHeader('content-type', 'text/xml');
    req.pipe(request(url))
        .on('response', function(incoming) {
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
            res.send(500, 'Problem connecting to form server');
        });
};
