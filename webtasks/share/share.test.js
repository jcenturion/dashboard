var chai = require('chai');

chai.should();

describe('Share Webtask', function() {
  var mock;

  afterEach(function () {
    mock.stop('github');
    mock.stopAll();
    delete require.cache[__dirname + '/share.js'];
  });

  describe('#getAllReferences', function () {
    var task;
    var allReferencesData;

    describe('parameters', function () {
      before(function () {
        mock = require('mock-require');
        mock('github', function () {
          return {
            authenticate: function(version, protocol, host, timeout) {},
            gitdata: {
              getAllReferences: function (data, cb) {
                allReferencesData = data;
              }
            }
          };
        });
        task = require('./share.js');
      });

      it('should correctly receive user', function () {
        // Act
        task({
          body: {
            recipe: '',
            content: {}
          },
          data: {
            GITHUB_TOKEN: 'token'
          }
        });

        // Assert
        allReferencesData.should.have.property('user');
        allReferencesData.user.should.be.equal('jcenturion');
      });

      it('should correctly receive repo', function () {
        // Act
        task({
          body: {
            recipe: '',
            content: {}
          },
          data: {
            GITHUB_TOKEN: 'token'
          }
        });

        // Assert
        allReferencesData.should.have.property('repo');
        allReferencesData.repo.should.be.equal('hawkeye-recipes');
      });
    });

    describe('on error', function () {
      before(function () {
        mock = require('mock-require');
        mock('github', function () {
          return {
            authenticate: function(version, protocol, host, timeout) {},
            gitdata: {
              getAllReferences: function (data, cb) {
                cb({status: 500}, null);
              }
            }
          };
        });
        task = require('./share.js');
      });

      it('should correcly handle errors', function () {
        // Act
        task({
          body: {
            recipe: '',
            content: {}
          },
          data: {
            GITHUB_TOKEN: 'token'
          }
        }, function (e, data) {
          // Assert
          data.step.should.be.equal('GETTING REFERENCES');
          data.error.status.should.be.equal(500);
        });
      });
    });
  });

  describe('#createTree', function () {
    var task;
    var treeData;

    describe('parameters', function () {
      before(function () {
        mock = require('mock-require');
        mock('github', function () {
          return {
            authenticate: function(version, protocol, host, timeout) {},
            gitdata: {
              getAllReferences: function (data, cb) {
                cb(null, [{
                  ref: 'refs/heads/master',
                  object: {
                    sha: 'd41d8cd98f00b204e9800998ecf8427e'
                  }
                }]);
              },
              createTree: function (data, cb) {
                treeData = data;
              }
            }
          };
        });
        task = require('./share.js');
      });

      it('should correctly receive base_tree', function () {
        // Act
        task({
          body: {
            recipe:  'recipe',
            content: {prop: 'value'}
          },
          data: {
            GITHUB_TOKEN: 'token'
          }
        });

        // Assert
        treeData.should.have.property('base_tree');
        treeData.base_tree.should.be.equal('d41d8cd98f00b204e9800998ecf8427e');
      });

      it('should correctly receive tree', function () {
        // Act
        task({
          body: {
            recipe:  'recipe',
            content: {prop: 'value'}
          },
          data: {
            GITHUB_TOKEN: 'token'
          }
        });

        // Assert
        treeData.should.have.property('tree');
        treeData.tree[0].should.have.property('path');
        treeData.tree[0].should.have.property('mode');
        treeData.tree[0].should.have.property('type');
        treeData.tree[0].should.have.property('content');
        treeData.tree[0].path.should.be.equal('recipes/recipe.json');
        treeData.tree[0].mode.should.be.equal('100644');
        treeData.tree[0].type.should.be.equal('blob');
        treeData.tree[0].content.should.be.equal('{"prop":"value"}');
      });

      it('should correctly receive user', function () {
        // Act
        task({
          body: {
            recipe:  'recipe',
            content: {prop: 'value'}
          },
          data: {
            GITHUB_TOKEN: 'token'
          }
        });

        // Assert
        treeData.should.have.property('user');
        treeData.user.should.be.equal('jcenturion');
      });

      it('should correctly receive repo', function () {
        // Act
        task({
          body: {
            recipe:  'recipe',
            content: {prop: 'value'}
          },
          data: {
            GITHUB_TOKEN: 'token'
          }
        });

        // Assert
        treeData.should.have.property('repo');
        treeData.repo.should.be.equal('hawkeye-recipes');
      });
    });

    describe('error', function () {
      before(function () {
        mock = require('mock-require');
        mock('github', function () {
          return {
            authenticate: function(version, protocol, host, timeout) {},
            gitdata: {
              getAllReferences: function (data, cb) {
                cb(null, [{
                  ref: 'refs/heads/master',
                  object: {
                    sha: 'd41d8cd98f00b204e9800998ecf8427e'
                  }
                }]);
              },
              createTree: function (data, cb) {
                cb({status: 500}, null);
              }
            }
          };
        });
        task = require('./share.js');
      });

      it('should correcly handle errors', function () {
        // Act
        task({
          body: {
            recipe: '',
            content: {}
          },
          data: {
            GITHUB_TOKEN: 'token'
          }
        }, function (e, data) {
          // Assert
          data.step.should.be.equal('FILE CREATION');
          data.error.status.should.be.equal(500);
        });
      });
    });
  });

  describe('#createCommit', function () {
    var task;
    var commitData;

    describe('parameters', function () {
      before(function () {
        mock = require('mock-require');
        mock('github', function () {
          return {
            authenticate: function(version, protocol, host, timeout) {},
            gitdata: {
              getAllReferences: function (data, cb) {
                cb(null, [{
                  ref: 'refs/heads/master',
                  object: {
                    sha: 'd41d8cd98f00b204e9800998ecf8427e'
                  }
                }]);
              },
              createTree: function (data, cb) {
                cb(null, {
                  sha: '8277e0910d750195b448797616e091ad'
                });
              },
              createCommit: function (data, cb) {
                commitData = data;
              }
            }
          };
        });
        task = require('./share.js');
      });

      it('should correctly receive user', function () {
        // Act
        task({
          body: {
            recipe:  'recipe',
            content: {prop: 'value'}
          },
          data: {
            GITHUB_TOKEN: 'token'
          }
        });

        // Assert
        commitData.should.have.property('user');
        commitData.user.should.be.equal('jcenturion');
      });

      it('should correctly receive repo', function () {
        // Act
        task({
          body: {
            recipe:  'recipe',
            content: {prop: 'value'}
          },
          data: {
            GITHUB_TOKEN: 'token'
          }
        });

        // Assert
        commitData.should.have.property('repo');
        commitData.repo.should.be.equal('hawkeye-recipes');
      });

      it('should correctly receive message', function () {
        // Act
        task({
          body: {
            recipe:  'recipe',
            content: {prop: 'value'}
          },
          data: {
            GITHUB_TOKEN: 'token'
          }
        });

        // Assert
        commitData.should.have.property('message');
        commitData.message.should.be.equal('Contributing with recipe \'recipe\'');
      });

      it('should correctly receive tree', function () {
        // Act
        task({
          body: {
            recipe:  'recipe',
            content: {prop: 'value'}
          },
          data: {
            GITHUB_TOKEN: 'token'
          }
        });

        // Assert
        commitData.should.have.property('tree');
        commitData.tree.should.be.equal('8277e0910d750195b448797616e091ad');
      });

      it('should correctly receive parents', function () {
        // Act
        task({
          body: {
            recipe:  'recipe',
            content: {prop: 'value'}
          },
          data: {
            GITHUB_TOKEN: 'token'
          }
        });

        // Assert
        commitData.should.have.property('parents');
        commitData.parents.should.be.deep.equal(['d41d8cd98f00b204e9800998ecf8427e']);
      });

      it('should correctly receive author', function () {
        // Act
        task({
          body: {
            recipe:  'recipe',
            content: {prop: 'value'}
          },
          data: {
            GITHUB_TOKEN: 'token'
          }
        });

        // Assert
        commitData.should.have.property('author');
        commitData.author.name.should.be.equal('dashboard');
        commitData.author.email.should.be.equal('auth0@support.com');
      });
    });

    describe('error', function () {
      before(function () {
        mock = require('mock-require');
        mock('github', function () {
          return {
            authenticate: function(version, protocol, host, timeout) {},
            gitdata: {
              getAllReferences: function (data, cb) {
                cb(null, [{
                  ref: 'refs/heads/master',
                  object: {
                    sha: 'd41d8cd98f00b204e9800998ecf8427e'
                  }
                }]);
              },
              createTree: function (data, cb) {
                cb(null, {
                  sha: '8277e0910d750195b448797616e091ad'
                });
              },
              createCommit: function (data, cb) {
                cb({status: 500}, null);
              }
            }
          };
        });
        task = require('./share.js');
      });

      it('should correcly handle errors', function () {
        // Act
        task({
          body: {
            recipe: '',
            content: {}
          },
          data: {
            GITHUB_TOKEN: 'token'
          }
        }, function (e, data) {
          // Assert
          data.step.should.be.equal('COMMIT CREATION');
          data.error.status.should.be.equal(500);
        });
      });
    });
  });

  describe('#createReference', function () {
    var task;
    var referenceData;

    describe('parameters', function () {
      before(function () {
        mock = require('mock-require');
        mock('github', function () {
          return {
            authenticate: function(version, protocol, host, timeout) {},
            gitdata: {
              getAllReferences: function (data, cb) {
                cb(null, [{
                  ref: 'refs/heads/master',
                  object: {
                    sha: 'd41d8cd98f00b204e9800998ecf8427e'
                  }
                }]);
              },
              createTree: function (data, cb) {
                cb(null, {
                  sha: '8277e0910d750195b448797616e091ad'
                });
              },
              createCommit: function (data, cb) {
                cb(null, {
                  sha: '0cc175b9c0f1b6a831c399e269772661'
                });
              },
              createReference: function (data, cb) {
                referenceData = data;
              }
            }
          };
        });
        task = require('./share.js');
      });

      it('should correctly receive user', function () {
        // Act
        task({
          body: {
            recipe:  'recipe',
            content: {prop: 'value'}
          },
          data: {
            GITHUB_TOKEN: 'token'
          }
        });

        // Assert
        referenceData.should.have.property('user');
        referenceData.user.should.be.equal('jcenturion');
      });

      it('should correctly receive repo', function () {
        // Act
        task({
          body: {
            recipe:  'recipe',
            content: {prop: 'value'}
          },
          data: {
            GITHUB_TOKEN: 'token'
          }
        });

        // Assert
        referenceData.should.have.property('repo');
        referenceData.repo.should.be.equal('hawkeye-recipes');
      });

      it('should correctly receive ref', function () {
        // Act
        task({
          body: {
            recipe:  'recipe',
            content: {prop: 'value'}
          },
          data: {
            GITHUB_TOKEN: 'token'
          }
        });

        // Assert
        referenceData.should.have.property('ref');
        referenceData.ref.should.be.equal('refs/heads/recipes/dashboard/recipe');
      });

      it('should correctly receive sha', function () {
        // Act
        task({
          body: {
            recipe:  'recipe',
            content: {prop: 'value'}
          },
          data: {
            GITHUB_TOKEN: 'token'
          }
        });

        // Assert
        referenceData.should.have.property('sha');
        referenceData.sha.should.be.equal('0cc175b9c0f1b6a831c399e269772661');
      });
    });

    describe('error', function () {
      before(function () {
        mock = require('mock-require');
        mock('github', function () {
          return {
            authenticate: function(version, protocol, host, timeout) {},
            gitdata: {
              getAllReferences: function (data, cb) {
                cb(null, [{
                  ref: 'refs/heads/master',
                  object: {
                    sha: 'd41d8cd98f00b204e9800998ecf8427e'
                  }
                }]);
              },
              createTree: function (data, cb) {
                cb(null, {
                  sha: '8277e0910d750195b448797616e091ad'
                });
              },
              createCommit: function (data, cb) {
                cb(null, {
                  sha: '0cc175b9c0f1b6a831c399e269772661'
                });
              },
              createReference: function (data, cb) {
                cb({status: 500}, null);
              }
            }
          };
        });
        task = require('./share.js');
      });

      it('should correcly handle errors', function () {
        // Act
        task({
          body: {
            recipe: '',
            content: {}
          },
          data: {
            GITHUB_TOKEN: 'token'
          }
        }, function (e, data) {
          // Assert
          data.step.should.be.equal('REFERENCE CREATION');
          data.error.status.should.be.equal(500);
        });
      });
    });
  });
});
