// Saves a file to github

var Hubfs = require('hubfs.js')
var extend = require('xtend')
var debug = require('debug')('simple-odk:github-store')
var concat = require('concat-stream')
var through2 = require('through2')
var https = require('https')
var Octokat = require('octokat')
var createFormList = require('openrosa-formlist')
var formListCache = require('../helpers/cache')

var defaults = {
  branch: 'master',
  userAgent: 'simple-odk'
}

function Store (options) {
  this.options = extend(defaults, options)
  this.hubfs = new Hubfs({
    owner: options.user,
    repo: options.repo,
    auth: {
      username: options.auth.name,
      password: options.auth.pass
    }
  })
  this.options.auth.user = this.options.auth.name
}

Store.prototype.saveForm = function (meta) {
  var filename = 'submissions/' + meta.formId + '/' + meta.instanceId + '.' + meta.ext
  var writeOptions = {
    message: 'Added new form response ' + filename,
    branch: this.options.branch
  }
  var stream = through2()
  var hubfs = this.hubfs

  debug('saving %s to github repo %s', filename, this.options.user + '/' + this.options.repo)

  return stream.pipe(concat(done))
  function done (data) {
    hubfs.writeFile(filename, data, writeOptions, function (err, data) {
      if (err) return stream.emit('error', err)
      stream.push(data)
      stream.push(null)
    })
  }
}

Store.prototype.getForm = function (id) {
  var requestOptions = {
    headers: {
      'User-Agent': this.options.userAgent,
      'Accept': 'application/vnd.github.v3.raw'
    },
    auth: this.options.auth.name + ':' + this.options.auth.pass,
    hostname: 'api.github.com',
    path: '/repos/' + this.options.user + '/' + this.options.repo + '/git/blobs/' + id
  }
  var stream = through2()

  https.get(requestOptions, function (incoming) {
    if (incoming.statusCode !== 200) {
      var err = new Error('Problem connecting to Github')
      err.status = incoming.statusCode
      return stream.emit('error', err)
    }
    incoming.pipe(stream)
  })

  return stream
}

Store.prototype.getFormList = function (baseUrl) {
  var cacheKey = 'gh/' + this.options.user + '/' + this.options.repo
  var stream = through2()
  var _this = this

  debug('Called formList for repo %s', cacheKey)

  formListCache.wrap(cacheKey, getFormListXml, function (err, buf) {
    if (err) return stream.emit('error', err)
    stream.push(buf)
    stream.push(null)
  })

  function getFormListXml (cb) {
    _this._getFormUrls(baseUrl, function (err, formUrls) {
      if (err) return cb(err)
      var formlistOptions = {
        headers: {
          'User-Agent': _this.options.userAgent
        },
        auth: _this.options.auth
      }
      createFormList(formUrls, formlistOptions, function (err, xml) {
        cb(err, new Buffer(xml))
      })
    })
  }

  return stream
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
