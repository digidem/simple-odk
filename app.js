var express  = require('express');

var defaultRoutes = require('./routes/default-routes');
var github   = require('./routes/github');
var firebase = require('./routes/firebase');
var gist     = require('./routes/gist');

var error    = require('./controllers/error-handler');

var app = express();

app.get('/', function(req, res) {
    res.send('ODK Server ready to receive submissions');
});

app.use('/', defaultRoutes);

app.use('/gh/:user/:repo', github);

app.use('/fb/:appname', firebase);

app.use('/gist/:gist_id', gist);

// Handle errors
app.use(error);

module.exports = app;
