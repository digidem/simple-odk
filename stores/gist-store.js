// Saves a file to github

var Gistfs = require('hubfs.js')
var extend = require('xtend')
var debug = require('debug')('simple-odk:github-store')
var concat = require('concat-stream')
var Stream = require('readable-stream')
var Octokat = require('octokat')
var request = require('request')
var createFormList = require('openrosa-formlist')
var formListCache = require('../helpers/cache')

var defaults = {
  userAgent: 'simple-odk'
}

function Store (options) {
  this.options = extend(defaults, options)
  this.gistfs = new Gistfs({
    user: options.user,
    gistId: options.gistId,
    auth: {
      username: options.auth.name,
      password: options.auth.pass
    }
  })
}

Store.prototype.saveForm = function (meta, callback) {
  var filename = meta.formId + '.' + meta.ext
  var featureCollection
  var gistfs = this.gistfs

  return concat(function(data) {
    gistfs.readFile(filename, { encoding: 'utf8' }, function (err, existingData) {
      if (err) {
        featureCollection = {
          type: 'FeatureCollection',
          features: []
        }
        debug('creating new geojson feature collection', filename)
      } else {
        try {
          featureCollection = JSON.parse(existingData)
          debug('appending to existing feature collection', filename)
        } catch (e) {
          return callback(new Error('Cannot parse gist json'))
        }
      }
      featureCollection.features.push(JSON.parse(data))
      gistfs.writeFile(filename, JSON.stringify(featureCollection, null, '  '), function (err) {
        if (err) return next(err)
        debug('saved form response %s to gist %s', filename, req.params.gist_id)
        res.status(201).send({
          saved: filename
        })
      })
    })
  })
}

Store.prototype.getForm = function (id) {
  var formUrl = 'https://gist.githubusercontent.com/' + this.options.user + '/' +
    this.options.gistId + '/raw/' + id
  return request.get(formUrl)
}

Store.prototype.getFormList = function (baseUrl) {
  var cacheKey = this.options.user + '/' + this.options.repo
  var stream = Stream.Readable()
  var _this = this

  debug('Called formList for repo %s', cacheKey)

  formListCache.wrap(cacheKey, getFormListXml, function (err, buff) {
    if (err) return stream.emit('error', err)
    stream.push(buff)
    stream.push(null)
  })

  function getFormListXml (cb) {
    _this._getFormUrls(baseUrl, function (err, formUrls) {
      if (err) return cb(err)

      var formlistOptions = {
        headers: {
          'User-Agent': this.options.userAgent
        },
        auth: this.options.auth
      }

      createFormList(formUrls, formlistOptions, function (err, xml) {
        cb(err, new Buffer(xml))
      })
    })
  }
}

/**
 * Reads an Octokat Github repo for any xforms in the folder `this.options.formsFolder`
 * @returns {Array} an array of urls to the forms.
 */
Store.prototype._getFormUrls = function (baseUrl, cb) {
  var octo = new Octokat({
    username: this.options.auth.name,
    password: this.options.auth.pass
  })
  var repo = octo.repos(this.options.user, this.options.repo)
  var formsFolder = this.options.formsFolder

  debug('getting formlist for repo', this.options.user + '/' + this.options.repo)

  repo.git.refs('heads/' + this.options.branch).fetch(function (err, ref) {
    debug('got repo head ref')
    if (err) return cb(err)
    repo.git.commits(ref.object.sha).fetch(function (err, commit) {
      debug('got repo head commit')
      if (err) return cb(err)
      repo.git.trees(commit.tree.sha).fetch(function (err, tree) {
        debug('got repo top-level tree')
        if (err) return cb(err)
        // Get the tree that matches the path `formsFolder`
        var formTree = tree.tree.reduce(function (prev, cur) {
          return (cur.path === formsFolder && cur.type === 'tree') ? cur : prev
        }, undefined)
        if (!formTree) return cb(new Error("can't find forms folder"))
        // Now recursively get the tree of files under the `formsFolder`
        repo.git.trees(formTree.sha + '?recursive=1').fetch(function (err, tree) {
          if (err) return cb(err)
          var formUrls = reduceTree(tree)
          cb(null, formUrls)
        })
      })
    })
  })

  /**
   * Takes a Github tree https://developer.github.com/v3/git/trees/#get-a-tree
   * and returns an array of urls for any xml files.
   * @param  {Object} tree Github tree object
   * @return {Array}       Array of urls to xml files
   */
  function reduceTree (tree) {
    return tree.tree.reduce(function (arr, leaf) {
      if (!/\.xml$/.test(leaf.path) || leaf.type !== 'blob') return arr
      arr.push(baseUrl + '/' + leaf.sha)
      return arr
    }, [])
  }
}

module.exports = Store
