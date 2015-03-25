var Octokat = require('octokat')
var debug = require('debug')('simple-odk:get-form-urls-github')

var FORMS_FOLDER = 'forms'

/**
 * Reads an Octokat Github repo for any xforms in the folder `FORMS_FOLDER`
 * @returns {Array} an array of urls to the forms.
 */
function getFormUrls (options, cb) {
  var octoOptions

  if (options.auth) {
    octoOptions = {
      username: options.auth.name,
      password: options.auth.pass
    }
  }

  var octo = new Octokat(octoOptions)

  var repo = octo.repos(options.user, options.repo)

  debug('getting formlist for repo', options.user + '/' + options.repo)

  repo.git.refs('heads/master').fetch(function (err, ref) {
    debug('got repo master ref')
    if (err) return cb(err)
    repo.git.commits(ref.object.sha).fetch(function (err, commit) {
      debug('got repo head commit')
      if (err) return cb(err)
      repo.git.trees(commit.tree.sha).fetch(function (err, tree) {
        debug('got repo top-level tree')
        if (err) return cb(err)
        // Get the tree that matches the path `FORMS_FOLDER`
        var formTree = tree.tree.reduce(function (prev, cur) {
          return (cur.path === FORMS_FOLDER && cur.type === 'tree') ? cur : prev
        }, undefined)
        if (!formTree) return cb(new Error("can't find forms folder"))
        // Now recursively get the tree of files under the `FORMS_FOLDER`
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
      arr.push(options.baseUrl + '/' + leaf.sha)
      return arr
    }, [])
  }
}

module.exports = getFormUrls
