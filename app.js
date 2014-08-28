var express = require('express');
var multiparty = require('multiparty');
var fs = require('fs');
var path = require('path');
var request = require('request');
var auth = require('basic-auth');
var config = require('./config.js');
var xform2json = require('./lib/xform2json.js');
var saveMedia, saveForm;

// Configure the persistance store for the forms and the media
if (config.mediaStore === "s3") {
    saveMedia = require('./lib/persist-s3.js');
} else {
    saveMedia = require('./lib/persist-fs.js');
}

if (config.formStore === "github") {
    saveForm = require('./lib/persist-github.js');
} else {
    saveForm = require('./lib/persist-fs.js');
}

// Captures the charset value from an HTTP `Content-Type` response header.
var REGEX_CHARSET = /;\s*charset\s*=\s*([^\s;]+)/i;

// These headers are required according to https://bitbucket.org/javarosa/javarosa/wiki/OpenRosaRequest
var OpenRosaHeaders = {
    "X-OpenRosa-Accept-Content-Length": config.acceptContentLength,
    "X-OpenRosa-Version": "1.0"
};

var app = express();

app.use(express.logger('dev'));

// All responses should include required OpenRosa headers.
app.use(function(req, res, next) {
    res.set(OpenRosaHeaders);
    next();
});

// If we are storing files on Github then we force the client (ODK Collect) to send
// authorization headers, but we don't check credentials here, but just pass them
// through to Github. Github responds to unauthorized requests with status 404 not 401,
// so we need to add this to force ODK Collect to send authorization headers.
if (config.formStore === 'github' || config.mediaStore === 'github') {
    app.use(function(req, res, next) {
        var user = auth(req);

        if (user === undefined) {
            res.statusCode = 401;
            res.setHeader('WWW-Authenticate', 'Basic realm="Wapichanao ODK"');
            res.send('Unauthorized');
        } else {
            next();
        }
    });
}

// *TODO* add a page describing the service here.
app.get('/', function(req, res) {
    res.send("Hello World");
});

// Need to respond to HEAD request as stated in https://bitbucket.org/javarosa/javarosa/wiki/FormSubmissionAPI
app.head('/submission', function(req, res) {
    res.send(204);
});

// Proxy requests to formList to a form server (e.g. formhub.org or odk-aggregate)
app.get('/formList', function(req, res) {
    res.setHeader('content-type', 'text/xml');
    req.pipe(request(config.formServer + "formList"))
        .on('response', function(incoming) {
                // If the upstream server served this file with a specific character
                // encoding, so should we.
                var charset = REGEX_CHARSET.exec(incoming.headers['content-type']),
                    type = 'text/xml';
                if (charset) type += '; charset=' + charset[1];

                // We need to correct the content type on proxied formLists from Github, which are served
                // as text/plain by default, which ODK Collect does not like.
                incoming.headers['content-type'] = type;
                res.writeHead(incoming.statusCode, incoming.headers);
                incoming.pipe(res);
            })
        .on('error', function(err) {
            console.log(err);
            res.send(500, "Problem connecting to form server");
        });
});

// Receive webhook post
app.post('/submission', function(req, res) {
    // Store the user authentication credentials, since we will need to pass these through to
    // Github later.
    var user = auth(req);

    // Create a Multiparty form parser which will calculate md5 hashes of each file received
    var form = new multiparty.Form({
        hash: "md5"
    });

    var mediaFiles = {};
    var xmlFile;

    function onSave(err, filename) {
        // *TODO* we should send some kind of alert if the files were not saved.
        if (err) console.log(err);
        else console.log("saved ", filename);
    }

    form.on('file', function(name, file) {
        var options = {};
        // We will need the content-type and content-length for Amazon S3 uploads
        // (this is why we can't stream the response directly to S3, since
        //  we don't know the file size until we receive the whole file)
        options.headers = {
            "content-type": file.headers["content-type"],
            "content-length": file.size
        };

        if (name === "xml_submission_file") {
            // If the file is the xml form data, store a reference to it for later.
            xmlFile = file.path;
        } else {
            // Any other files, stream them to persist them.
            var stream = fs.createReadStream(file.path);
            // The filename is the md5 hash of the file with the original extension
            options.filename = file.hash + path.extname(file.originalFilename);
            // We store a reference to new filenames, to modify the references in the XML file later
            mediaFiles[file.originalFilename] = options.filename;
            // Persist the result, to the filesystem or to Amazon S3
            saveMedia(stream, options, onSave);
        }
    });

    form.on('close', function() {
        if (!xmlFile) {
            res.send(400, "Missing xml file");
        } else {
            fs.readFile(xmlFile, function(err, data) {
                // parse the xml form response into a JSON string.
                xform2json(data, mediaFiles, req.query, function(err, result) {
                    var options = {};
                    // Place forms in a folder named with the formId, and name the form from its instanceId
                    options.filename = result.formId + "/" + result.instanceId.replace(/^uuid:/, "") + ".json";
                    options.auth = user;
                    // Persist the result (could be filesystem, could be Github)
                    saveForm(result.json, options, onSave);
                    // Let ODK Collect know we have received everything and are processing it
                    res.send(202);
                });
            });
        }
    });

    // Close connection
    form.parse(req);

});

// Start server
var port = process.env.PORT || 8080;
app.listen(port);
console.log('Listening on port ' + port);
