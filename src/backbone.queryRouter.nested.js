// ## Introduction
// Modern web applications have many moving parts, and traditional webapp routing is far too restrictive
// to deal with real-world apps.
// 
// A modern webapp may have many independent bits of serializable state that must be correctly transmitted
// when a URL is sent to another user. For example, a music app may want to send the current song, position within
// the song, and location within a browsing window. A search app may want to transmit the current query,
// selected results, expansion of those results, and user preferences.
// 
// It is not always possible to store complex state in localStorage or cookies, if you want to transmit that
// complex state to other users via a URL. It can very quickly become unwieldy to create massive 'multi-routes',
// where sections of the URL delegate to subrouters. Every time a new widget with state is added, a new 
// section must be added to the route, and all links updated.
// 
// Querystrings are a perfect solution to this problem, and with HTML5 pushState, they can easily be used
// on the client and the server.

// ## Example
//
// ```javascript
// var QueryAwareRouter = Backbone.Router.extend({
// 
//   // Normal routes definition - this is unchanged.
//   routes: {
//     ...
//   },
// 
//   // QueryRoutes are defined here. They are defined in 
//   // the format:
//   // {String} keys : {String} handlerName
//   queryRoutes: {
//     // Here you can specify which keys you want to listen to.
//     // The attached handler will be fired each time any of 
//     // the keys are added, removed, or changed.
//     'volume': 'setVolume',
//     // To listen to multiple keys, separate them with commas. 
//     // Whitespace is ignored.
//     'playState, songID' : 'playSong',
//     // This file enables support of nested attributes.
//     'object.nestedProperty': 'nestedHandler'
//   },
//   // handler definitions...
// });
// ```

// ## Annotated Code
'use strict';
// CommonJS includes. This is a browserify module and will run both inside Node and in the browser.
var Backbone = (window && window.Backbone) || require('backbone');
var _ = (window && window._) || require('underscore');
var diff = require('deep-diff');

/**
 * Backbone.History overrides.
 * @type {Backbone.History}
 */
var QueryHistory = Backbone.History.extend( /** @lends QueryHistory# **/{

  /**
   * Model emcompassing current query state. You can read and set properties
   * on this Model and `Backbone.history.navigate()` will automatically be called.
   * If Backbone.NestedModel is loaded, it will be used to support nested change events.
   * @type {Backbone.Model}
   */
  query: Backbone.NestedModel ? new Backbone.NestedModel() : new Backbone.Model(),

  /**
   * Given two objects, compute their differences and list them.
   * When diffing deep objects, return one string for the object and one for each child.
   * This allows functions to bind to deep properties or its parent.
   * E.g. a change to a.b.c returns ['a', 'a.b', 'a.b.c']
   *
   * This uses DeepDiff (flitbit/diff), which can detect changes deep within objects.
   * We don't use objects in querystrings quite yet, but we do arrays. And that might change.
   *
   * @example
   *   _getDiffs({q: 'foo', deep: {object: 'blah'}}, {q: 'bar', fq: 'foo', deep: {object: 'blah2'}})
   *     -> ['q', 'fq', 'deep', 'deep.object']
   *
   * @param  {Object} lhs Left hand object.
   * @param  {Object} rhs Right hand (new) object.
   * @return {Array}      Array of string differences.
   */
  _getDiffs: function(lhs, rhs) {
    var diffs = diff(lhs, rhs);
    var diffKeys = _.reduce(diffs, function(result, diff) {
      var paths = _.map(diff.path, function(path, i) {
        return _.first(diff.path, i + 1).join('.');
      });
      return result.concat(paths);
    }, []);
    return _.uniq(diffKeys);
  }
});

// Replace Backbone.history.
Backbone.history = new QueryHistory();
