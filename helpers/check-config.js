var debug = require('debug')('simple-odk:check-config')

module.exports = function (config) {
  switch (config.formStore) {
    case 'github':
      if (!config.repo || !config.user) {
        throw new Error('You must provide `githubRepo` and `githubUser` in domain config')
      } else {
        debug('using Github repo %s for %s', config.user + '/' + config.repo)
      }
      break

    case 'firebase':
      if (!config.appname) {
        throw new Error('You must provide a firebase `appname` in domain config')
      } else {
        debug('using Firebase app % for %s', config.appname)
      }
      break

    case 'gist':
      if (!config.gist_id) {
        throw new Error('You must provide a Gist `gist_id` in domain config')
      } else {
        debug('using Gist id %s for %s', config.gist_id)
      }
      break

    default:
      throw new Error('No valid formStore found')
  }
}
