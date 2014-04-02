'use strict';

var _ = require('underscore');
var path = require('path');
var matchdep = require('matchdep');

module.exports = function(grunt) {

  grunt.initConfig({
    clean: {
      dist: ['dist/*.js'],
      test: ['test/**/build/*.js', '_SpecRunner.html']
    },
    browserify: {
      options: {
        external: ['backbone', 'underscore'],
        debug: false
      },
      dist: {
        src: ['src/backbone.queryRouter.js'],
        dest: 'dist/backbone.queryRouter.browser.js'
      },
      nestedDist: {
        options: {
          alias: 'qs:querystring' // Use node-querystring (nested support) instead of querystring
        },
        src: ['src/*.js'],
        dest: 'dist/backbone.queryRouter.nested.browser.js'
      }
    },
    uglify: {
      dist: {
        files: {
          'dist/backbone.queryRouter.browser.min.js': 'dist/backbone.queryRouter.browser.js',
          'dist/backbone.queryRouter.nested.browser.min.js': 'dist/backbone.queryRouter.nested.browser.js'
        }
      }
    },
    coffee: {
      test: {
        options: {
          sourceMap: false
        },
        expand: true,
        cwd: 'test',
        src: ['**/*.coffee'],
        dest: 'test',
        rename: function(dest, src){
          return path.join(dest, path.dirname(src), "/build", path.basename(src));
        },
        ext: '.coffee.js'
      }
    },
    jasmine: {
      options: {
        helpers: 'test/helpers/build/*.js',
        vendor: [
          'bower_components/jquery/dist/jquery.js',
          'bower_components/underscore/underscore.js',
          'bower_components/backbone/backbone.js'
        ]
      },
      test: {
        src: 'dist/backbone.queryRouter.browser.js',
        options: {
          specs: 'test/spec/build/*.js'
        }
      },
      testNested: {
        src: 'dist/backbone.queryRouter.nested.browser.js',
        options: {
          specs: ['test/spec/build/*.js', 'test/spec/nested/build/*.js']
        }
      }
    },
    docker : {
      dist : {
        src: ['src/*.js', 'README.md'], 
        dest: 'doc',
        options: {
          lineNums: true
        }
      }
    },
    jshint: {
      validate: {
        src: ['src/**/*.js']
      },
      options: grunt.file.readJSON('.jshintrc')
    },
  });


  // Load all grunt tasks in package.json
  _.each(matchdep.filterAll('grunt-*'), function(pkgName){
    grunt.loadNpmTasks(pkgName);
  });
  grunt.registerTask('test', ['clean:test', 'browserify', 'coffee:test', 'jasmine']);
  grunt.registerTask('release', ['clean:dist', 'browserify', 'uglify']);
  grunt.registerTask('default', ['jshint', 'test', 'release', 'docker']);
};
