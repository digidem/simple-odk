var express = require('express');
var logger = require('morgan');

var defaultRoute = require('./routes/default-route');
var github = require('./routes/github');
var firebase = require('./routes/firebase');
var gist = require('./routes/gist');

var app = express();

// Use 'combined' log formatting see https://github.com/expressjs/morgan
app.use(logger('combined'));
var error    = require('./controllers/error-handler');

// Allows default handler for custom installs attached to a particular store
app.use('/', defaultRoute);

app.use('/gh/:user/:repo', github);

app.use('/fb/:appname', firebase);

app.use('/gist/:gist_id', gist);

// Handle errors
app.use(error);

module.exports = app;
