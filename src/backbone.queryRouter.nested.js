// ## Backbone.queryRouter.nested.js
// Overrides for handling nested querystrings & nested models.

'use strict';
// CommonJS includes. This is a browserify module and will run both inside Node and in the browser.
var Backbone = (window && window.Backbone) || require('backbone');
var _ = (window && window._) || require('underscore');
var diff = require('deep-diff');

/**
 * Backbone.History nested support.
 * @type {Backbone.History}
 */

/**
 * Model emcompassing current query state. You can read and set properties
 * on this Model and `Backbone.history.navigate()` will automatically be called.
 * If Backbone.NestedModel is loaded, it will be used to support nested change events.
 * @type {Backbone.Model}
 */
var _toString = Backbone.history.query.toString; // must be restored later

Backbone.history.query = Backbone.NestedModel ? 
  new Backbone.NestedModel() : new Backbone.Model();

Backbone.history.query.toString = _toString;


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
Backbone.history._getDiffs = function(lhs, rhs) {
  var diffs = diff(lhs, rhs);
  var diffKeys = _.reduce(diffs, function(result, diff) {
    var paths = _.map(diff.path, function(path, i) {
      return _.first(diff.path, i + 1).join('.');
    });
    return result.concat(paths);
  }, []);
  return _.uniq(diffKeys);
};
