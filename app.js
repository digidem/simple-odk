var express = require('express')
var morgan = require('morgan')

// var vhosts = require('./routes/vhosts')
// var github = require('./routes/github')
// var firebase = require('./routes/firebase')
// var gist = require('./routes/gist')
// var aliases = require('./routes/aliases')
var test = require('./routes/test')
var error = require('./controllers/error-handler')

var app = express()

app.use(morgan('dev'))

app.get('/', function (req, res) {
  res.send('Simple ODK Server ready to receive submissions')
})

app.use('/', test)

// Handle errors
app.use(error)

module.exports = app
