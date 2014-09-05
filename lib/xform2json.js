/*
  Parses an xform submission from ODK collect into a JSON string, cleaning up the data and adding metadata
 */

var xml2js = require('xml2js');
var parseGeopoint = require('./parse_geopoint.js');
var parseBoolean = require('./parse_boolean.js');
var uuid = require('uuid');
var traverse = require('traverse');

module.exports = function(data, meta, callback) {
    meta = meta || {};

    var parser = new xml2js.Parser({
        explicitArray: false,
    });

    parser.parseString(data, function(err, result) {
        var data, prop;

        // ODK Collect sends an object with a single property named from the form.
        // The value of this property is what we are interested in
        for (prop in result) {
            data = result[prop];
        }

        // Organize form metadata under a single property (deleting any duplicated values)
        data.meta = {
            instanceId: (data.meta && data.meta.instanceID) || "uuid:" + uuid.v1(),
            instanceName: (data.meta && data.meta.instanceName) || prop,
            formId: data.$.id,
            version: data.$.version,
            submissionTime: new Date()
        };
        delete data.$;

        // Add metadata passed to function
        for (prop in meta) {
            if (meta.hasOwnProperty(prop)) data.meta[prop] = meta[prop];
        }

        // Turn boolean strings into native objects, and turn the geopoint into something more readable
        result = traverse(data).forEach(replacer);

        if (err) console.log(err);

        callback(err, result);
    });

    function replacer(value) {
        var result = value;

        // Properties whose value is null or an empty string are removed from the JSON
        if (value === "" || value === null) this.remove();

        try {
            result = JSON.parse(value);
        } catch (e) {
            // Parses geopoints and returns an object with the coordinates, altitude and precision
            if (typeof value === "string") result = parseGeopoint(value);
        }

        if (result !== value) this.update(result);
    }
};
