var GitHubApi = require('github');

module.exports = function(context, cb) {
  if (context.body) {
    var config = {
      user: 'jcenturion',
      repo: 'hawkeye-recipes',
      commitMessage: function () {
        return 'Contributing with recipe \'' + this.recipe + '\'';
      },
      getFilePath: function () {
        return 'recipes/' + this.recipe.replace(/ /g, '-').toLocaleLowerCase() + '.json';
      },
      getReferenceName: function () {
        return 'recipes/' + this.userInfo.nickname.replace(/ /g, '-').toLocaleLowerCase() + '/' + this.recipe.replace(/ /g, '-').toLocaleLowerCase();
      }
    };
    var github = new GitHubApi({
      version:  '3.0.0',
      protocol: 'https',
      host:     'api.github.com',
      timeout:  5000,
    });

    config.recipe   = context.body.recipe;
    config.content  = context.body.content;
    config.userInfo = context.body.userInfo;

    if (typeof config.userInfo === 'undefined' || config.userInfo === null) {
      config.userInfo = { nickname: 'dashboard', email: 'auth0@support.com' };
    }

    config.userInfo.nickname = config.userInfo.nickname || 'dashboard';
    config.userInfo.email    = config.userInfo.email || 'auth0@support.com';

    github.authenticate({
      type:  'token',
      token: context.data.GITHUB_TOKEN
    });

    github.gitdata.getAllReferences({
        user: config.user,
        repo: config.repo,
      }, function(err, res) {
        if (err !== null) {
          cb(null, {
            step:  'GETTING REFERENCES',
            error: err
          });
        } else {
          var lastCommitSHA = res.filter(function (repo) { return repo.ref === 'refs/heads/master'}).pop().object.sha;
          var treeSHA;
          var commitSHA;

          // Create a File
          github.gitdata.createTree({
              base_tree: lastCommitSHA,
              user: config.user,
              repo: config.repo,
              tree: [{
                path:    config.getFilePath(),
                mode:    '100644',
                type:    'blob',
                content: JSON.stringify(config.content)
              }]
            }, function (err, res) {
              if (err !== null) {
                cb(null, {
                  step:  'FILE CREATION',
                  error: err
                });
              } else {
                treeSHA = res.sha;
                // Create a Commit
                github.gitdata.createCommit({
                    user:    config.user,
                    repo:    config.repo,
                    message: config.commitMessage(),
                    tree:    treeSHA,
                    parents: [
                      lastCommitSHA // -> Master lastcommit
                    ],
                    author: {
                      name:  config.userInfo.nickname,
                      email: config.userInfo.email,
                      date:  (new Date()).toISOString()
                    }
                  }, function(err, res) {
                    if (err !== null) {
                      cb(null, {
                        step:  'COMMIT CREATION',
                        error: err
                      });
                    } else {
                      commitSHA = res.sha;
                      // Create a Reference
                      github.gitdata.createReference({
                          user: config.user,
                          repo: config.repo,
                          ref:  'refs/heads/' + config.getReferenceName(),
                          sha:  commitSHA
                        }, function(err, res) {
                          if (err !== null) {
                            cb(null, {
                              step:  'REFERENCE CREATION',
                              error: err
                            });
                          } else {
                            // Create a PR
                            github.pullRequests.create({
                                user:  config.user,
                                repo:  config.repo,
                                title: config.commitMessage(),
                                body:  '',
                                base:  'master',
                                head:  config.getReferenceName()
                              }, function(err, res) {
                                if (err !== null) {
                                  cb(null, {
                                    step:  'PR CREATION',
                                    error: err
                                  });
                                }

                                cb(null, {
                                  link: res.html_url
                                });
                              });
                          }
                        });
                    }
                  });
              }
            });
        }
      });
  } else {
    cb(null, {});
  }
}
