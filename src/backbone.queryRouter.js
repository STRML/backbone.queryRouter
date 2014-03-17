'use strict';
var Backbone = require('backbone');
var _ = require('underscore');
var querystring = require('querystring');
var diff = require('deep-diff');

/**
 * Backbone.History overrides.
 * @type {Backbone.History}
 */
var QueryHistory = Backbone.History.extend( /** @lends QueryHistory# **/{

  /**
   * Extracts querystrings from routes.
   * @type {RegExp}
   */
  queryMatcher: /^([^?]*?)(?:\?([\s\S]*))?$/,
  query: new Backbone.Model(),

  /**
   * Parse a fragment into a query object and call handlers matching.
   * @param {String} fragment Route fragment.
   * @param {Object} options Navigation options.
   */
  loadQuery: function(fragment, options) {
    // init
    if (!this.previousQuery) this.previousQuery = {};

    var query = this._fragmentToQueryObject(fragment);
    var previous = this.previousQuery;

    // Save previous query.
    this.previousQuery = query;

    // Diff new and old queries.
    var diffs = this._getDiffs(previous, query);

    if (!diffs.length) return;

    // Call each function that subscribes to these items.
    // This is intentional, rather than fire events on each changed item;
    // this way, you don't have to debounce your handlers since they are only called once,
    // even if multiple query items change.
    _.each(this.queryHandlers, function(handler) {
      if (_.union(diffs, handler.bindings).length) {
        handler.callback(fragment);
      }
    });
  },

  /**
   * Override loadUrl & watch return value. Trigger event if no route was matched.
   * @return {Boolean} True if a route was matched.
   */
  loadUrl: function() {
    var matched = Backbone.History.prototype.loadUrl.apply(this, arguments);
    if (!matched) {
      this.trigger('routeNotFound', arguments);
    }
    return matched;
  },

  /**
   * Add loadQuery hook.
   * Add 'forceTrigger' option that will trigger a route regardless of whether 
   * or not we're already at that route.
   * Also trigger '[before, after]Navigate' event.
   *
   * Backbone.History is the prototype name, Backbone.history is the actual object, 
   * but Backbone.History stores the 'started' flag. Whatever.
   */
  navigate: function(fragment, options) {
    if (!options) options = {};

    // Throw a navigate route so we can hook to this elsewhere in the app.
    this.trigger('beforeNavigate', fragment, options);

    // Fire querystring routes.
    if (options.trigger) {
      this.loadQuery(fragment, options);
    }

    // Support 'forceTrigger' to trigger a route even if the url hasn't changed.
    // Have to check History.started here if we call loadUrl directly.
    if (options.forceTrigger && Backbone.history.fragment === fragment && Backbone.History.started) {
      this.loadUrl(fragment);
    } else {
      // Call navigate on prototype since we just overrode it
      Backbone.History.prototype.navigate.call(Backbone.history, fragment, options);
    }
    this.trigger('afterNavigate', fragment, options);
  },

  /**
   * Add a query to be tested when the fragment changes.
   * @param  {Array}   bindings  Query keys to listen to.
   * @param  {Function} callback Callback to call when these keys change.
   */
  queryHandler: function(bindings, callback) {
    if (!this.queryHandlers) this.queryHandlers = [];
    this.queryHandlers.push({bindings: bindings, callback: callback});
  },

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
  },

  /**
   * Given a fragment, return a query object.
   * @param  {String} fragment Route fragment.
   * @return {Object}          Query object.
   */
  _fragmentToQueryObject: function(fragment) {
    if (!fragment) return {};
    var match = fragment.match(this.queryMatcher);
    if (match.length < 3) return;
    var qs = match[2] || '';
    return querystring.parse(qs);
  }
});

/**
 * Backbone.Router overrides.
 * @type {Backbone.Router}
 */
var QueryRouter = Backbone.Router.extend(/** @lends QueryRouter# */{

});

// Override default Backbone.Router constructor.
Backbone.Router = QueryRouter;
// Replace Backbone.history.
Backbone.history = new QueryHistory();


