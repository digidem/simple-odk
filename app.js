var express = require('express');
var logger = require('morgan');

var defaultRoute = require('./routes/default-route');
var github = require('./routes/github');
var firebase = require('./routes/firebase');
var gist = require('./routes/gist');

var app = express();

// Use 'combined' log formatting see https://github.com/expressjs/morgan
app.use(logger('combined'));

// Allows default handler for custom installs attached to a particular store
app.use('/', defaultRoute);

app.use('/gh/:user/:repo', github);

app.use('/fb/:appname', firebase);

app.use('/gist/:gist_id', gist);

// Log errors
app.use(function logErrors(err, req, res, next) {
  console.error(err.stack);
  next(err);
});

// Client Error handler
app.use(function clientErrorHandler(err, req, res) {
    res.status(err.status || 500).send({ error: 'Something went wrong' });
});

module.exports = app;
