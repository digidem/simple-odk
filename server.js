var app = require('./app')

// Start server
var port = process.env.PORT || 8080
app.listen(port)
console.log('Listening on port %s', port)
