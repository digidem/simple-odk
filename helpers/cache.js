var cacheManager = require('cache-manager')

// Cache up to 10Mb of buffers in memory, with a 5 min TTL
module.exports = cacheManager.caching({
  store: 'memory',
  max: 10 * 1000 * 1000,
  ttl: 5 * 60, /*seconds*/
  length: function (s) { return s.length }
})
