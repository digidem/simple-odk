/**
 * Reads an Octocat Github repo for any xforms in the folder `FORMS_FOLDER`
 * @returns {Array} an array of urls to the forms.
 */
var Octokat  = require('octokat');

var FORMS_FOLDER = 'forms';

function getFormUrls(options, cb) {

  var octoOptions;

  if (options.auth) {
    octoOptions = {
      username: options.auth.name,
      password: options.auth.pass
    };
  }

  var octo = new Octokat(octoOptions);

  var repo = octo.repos(options.user, options.repo);

  repo.git.refs('heads/master').fetch(function(err, ref) {
    if (err) return cb(err);
    repo.git.commits(ref.object.sha).fetch(function(err, commit) {
      if (err) return cb(err);
      repo.git.trees(commit.tree.sha).fetch(function(err, tree) {
        if (err) return cb(err);
        tree = tree.tree.reduce(function(leaf) {
          if (leaf.path === FORMS_FOLDER && leaf.type === 'tree')
            return leaf;
        });
        repo.git.trees(tree.sha + '?recursive=1').fetch(function(err, tree) {
          if (err) return cb(err);
          var formUrls = reduceTree(tree);
          cb(null, formUrls);
        });
      });
    });
  });

  function reduceTree(tree) {
    return tree.tree.reduce(function(arr, leaf) {
      if (!/\.xml$/.test(leaf.path) || leaf.type !== 'blob') return arr;
      arr.push(leaf.url);
      return arr;
    }, []);
  }
}

module.exports = getFormUrls;
