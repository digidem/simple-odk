var crypto = require('crypto')

/**
 * Simple sha256 hash of string with crypto
 */
module.exports = function (str) {
  var c = crypto.createHash('sha256')
  c.update(new Buffer(str))
  return c.digest().toString('hex')
}
