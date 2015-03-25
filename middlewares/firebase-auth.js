var auth = require('basic-auth');
var Firebase = require('firebase');

/**
 * Middleware to authenticate to Firebase with Basic Auth. Attaches the
 * authenticated Firebase ref to the req object
 */
function FirebaseAuth() {
    return function(req, res, next) {
        var user = auth(req);
        var firebaseApp = req.params.appname;

        if (user === undefined || !firebaseApp) return unauthorized();

        var ref = new Firebase('https://' + firebaseApp + '.firebaseio.com');

        ref.authWithPassword({
          email    : user.name,
          password : user.pass
        }, authHandler);

        function authHandler(err) {
            if (err) return unauthorized();
            req.firebase = ref;
            next();
        }

        function unauthorized() {
            res.statusCode = 401;
            res.setHeader('WWW-Authenticate', 'Basic realm=simple-odk');
            res.send('Unauthorized');
        }
    };
}

module.exports = FirebaseAuth;
