/**
 * Very simple middleware to attach / override request parameters
 * @param  {Object} params  Parameters to attach to `req.params`
 * @param  {Object} options Set `options.override=true` to override
 * `req.params.param` if it already exists
 */
module.exports = function (params, options) {
  options = options || {}

  return function (req, res, next) {
    for (var param in params) {
      if (!req.params[param] || options.override) {
        req.params[param] = params[param]
      }
    }
    next()
  }
}
