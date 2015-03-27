var express = require('express')
var morgan = require('morgan')

var vhosts = require('./routes/vhosts')
var github = require('./routes/github')
var firebase = require('./routes/firebase')
var gist = require('./routes/gist')
var aliases = require('./routes/aliases')
var error = require('./controllers/error-handler')

var app = express()

app.use(morgan('dev'))

app.get('/', function (req, res) {
  res.send('Simple ODK Server ready to receive submissions')
})

app.use('/', vhosts)

app.use('/gh/:user/:repo', github)

app.use('/fb/:appname', firebase)

app.use('/gist/:gist_id', gist)

app.use('/', aliases)

// Handle errors
app.use(error)

module.exports = app
