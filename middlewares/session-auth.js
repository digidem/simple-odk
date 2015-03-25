/**
 * Stores authorization header in a memory store under unique key.
 * Not currently used.
 */

var nodeCache = require('node-cache');
var uid2 = require('uid2');

var sessionCache = new nodeCache({ stdTTL: 600 });

module.exports = function(req, res, next) {
  if (req.query.token) {
    sessionCache.get(req.query.token, function(err, value) {
      if (err) return next();
      if (!value[req.query.token]) {
        err = new Error('Token is invalid or expired');
        err.status = 403;
        next(err);
      }
      req.headers.authorization = value[req.query.token];
      next();
    });
  } else if (req.headers.authorization) {
    uid2(64, function(err, uid) {
      if (err) return next();
      sessionCache.set(uid, req.headers.authorization, function(err, success) {
        if (err || !success) return next();
        req.sessionToken = uid;
        next();
      });
    });
  } else {
    next();
  }
};
