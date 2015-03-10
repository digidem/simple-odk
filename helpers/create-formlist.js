// Receives an array of form urls and creates a formList xml
var xml = require('xml');

var start = '<?xml version="1.0" encoding="UTF-8" ?>\n' +
            '<xforms xmlns="http://openrosa.org/xforms/xformsList">\n';

var end = '\n</xforms>';

function createFormlist(formMeta) {
  var xmlString = start;

  formMeta.forEach(function(meta) {
    var obj = {
      xform: [
        { formId: meta.id },
        { name: meta.name },
        { version: meta.version },
        { hash: 'md5:' + meta.md5 },
        { downloadUrl: meta.url }
      ]
    };
    xmlString += xml(obj, { indent: '  ' });
  });

  return xmlString += end;
}

module.exports = createFormlist;
