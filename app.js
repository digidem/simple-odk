var express  = require('express');

var github   = require('./routes/github');
var firebase = require('./routes/firebase');
var gist     = require('./routes/gist');

var error    = require('./controllers/error-handler');

var app = express();

app.use('/gh/:user/:repo', github);

app.use('/fb/:appname', firebase);

app.use('/gist/:gist_id', gist);

// Handle errors
app.use(error);

module.exports = app;
