// Takes an xml stream or url and parses form name, id, version and md5 hash

var expat = require('node-expat');
var crypto = require('crypto');
var request = require('request');
var Stream = require('stream');

var mediaRe = /jr\:\/\/(images|audio|video)/i;

function parseFormMeta(xmlStream, callback) {
  var parser = new expat.Parser('UTF-8'),
    md5 = crypto.createHash('md5'),
    path = '',
    meta = {
      media: false,
      url: xmlStream.uri.href
    };

  if (!(xmlStream instanceof Stream)) {
    xmlStream = request.get(xmlStream);
  }

  parser.on('startElement', function(name, attrs) {
    if (path === '/h:html/h:head/model/instance' && !meta.id) {
      meta.id = attrs.id || name;
      meta.version = attrs.version;
    }
    path += '/' + name;
  });

  parser.on('endElement', function(name) {
    var re = new RegExp('\/' + name + '$', 'i');
    path = path.replace(re, '');
  });

  parser.on('text', function(text) {
    if (path === '/h:html/h:head/h:title' && !meta.name) {
      meta.name = text;
    }
    if (mediaRe.test(text)) {
      meta.media = true;
    }
  });

  parser.on('error', callback);

  xmlStream.on('data', function(d) {
    md5.update(d);
  });

  parser.on('end', function() {
    meta.md5 = md5.digest('hex');
    callback(null, meta);
  });

  xmlStream.pipe(parser);
}

module.exports = parseFormMeta;
