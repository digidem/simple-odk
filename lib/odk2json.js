/*
  Parses xml from ODK collect into a JSON string, cleaning up the data and adding metadata
 */

var xml2js = require('xml2js');
var parseGeopoint = require('./parse_geopoint.js');
var parseBoolean = require('./parse_boolean.js');
var uuid = require('uuid');

module.exports = function(data, matches, query, callback) {
    callback = arguments[arguments.length - 1];

    var parser = new xml2js.Parser({
        explicitArray: false,
    });

    parser.parseString(data, function(err, result) {
        var data, meta;

        // ODK Collect sends an object with a single property named from the form.
        // The value of this property is what we are interested in
        for (var prop in result) {
            data = result[prop];
        }

        // Organize form metadata under a single property (deleting any duplicated values)
        data.meta = {
            instanceId: (data.meta && data.meta.instanceID) || "uuid:" + uuid.v1(),
            instanceName: (data.meta && data.meta.instanceName) || prop,
            formId: data.$.id,
            version: data.$.version,
            deviceId: query.deviceID,
            submissionTime: new Date()
        };
        delete data.$;

        // return metadata and the JSON string, parsed by the `replacer` function
        result = {
            data: JSON.parse(JSON.stringify(data, replacer, "    ")),
            json: JSON.stringify(data, replacer, "    "),
            formId: data.meta.formId,
            instanceId: data.meta.instanceId
        };

        callback(err, result);
    });

    function replacer(key, value) {
        var result = value;

        // Properties whose value is null or an empty string are removed from the JSON
        if (result === "" || result === null) result = undefined;

        // Any files uploaded with the form are saved with new filenames,
        // so we need to replace the filenames in the JSON
        if (typeof result === "string" && matches[result]) result = getFileDescription(value);

        // Parses true and false string values to boolean
        if (typeof result === "string") result = parseBoolean(value);

        // Parses geopoints and returns an object with the coordinates, altitude and precision
        if (typeof result === "string") result = parseGeopoint(result);

        return result;
    }

    function getFileDescription(filename) {
        var result = {
            filename: matches[filename],
            originalFilename: filename
        };
        // delete the filename so we don't process it twice (JSON replacer is recursive)
        delete matches[filename];
        return result;
    }
};


