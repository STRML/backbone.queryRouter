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
      dist: {
        options: {
          external: ['backbone', 'underscore'],
          insertGlobals: false,
          debug: false
        },
        src: ['src/*.js'],
        dest: 'dist/backbone.queryRouter.browser.js'
      },
      test: {
        src: ['src/*.js'],
        dest: 'test/build/backbone.queryRouter.js'
      }
    },
    uglify: {
      dist: {
        files: {
          'dist/backbone.queryRouter.browser.min.js': 'dist/backbone.queryRouter.browser.js'
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
      test: {
        src: 'test/build/backbone.queryRouter.js',
        options: {
          specs: 'test/spec/build/*.js'
        }
      }
    }
  });


  
  // Load all grunt tasks in package.json
  _.each(matchdep.filterAll('grunt-*'), function(pkgName){
    grunt.loadNpmTasks(pkgName);
  });
  grunt.registerTask('test', ['clean:test', 'browserify:test', 'coffee:test', 'jasmine']);
  grunt.registerTask('release', ['clean:dist', 'browserify', 'uglify']);
  grunt.registerTask('default', ['test', 'release']);
};
