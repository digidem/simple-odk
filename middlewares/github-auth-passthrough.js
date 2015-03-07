// Middleware to passthrough auth to Github
var auth = require('basic-auth');
var request = require('request');

var appName = process.env.APP_NAME || "SimpleODK";

request.defaults({
    headers: { "User-Agent": appName }
});

function GithubAuth() {
    return function(req, res, next) {
        var user = auth(req);

        if (user === undefined) return unauthorized();

        request
            .get('https://api.github.com/user')
            .auth(user.name, user.pass, true)
            .on('response', function(response) {
                if (response.statusCode === 401) return unauthorized();
                if (response.statusCode === 200) return next();
                var err = new Error('Authentication error');
                err.status = response.statusCode;
                response.pipe(process.stdout);
                next(err);
            })
            .on('error', next);

        function unauthorized() {
            res.statusCode = 401;
            res.setHeader('WWW-Authenticate', 'Basic realm="' + appName + '"');
            res.send('Unauthorized');
        }
    };
}

module.exports = GithubAuth;
