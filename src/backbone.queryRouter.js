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
//     'playState, songID' : 'playSong'
//   },
//   // handler definitions...
// });
// ```

// ## Annotated Code
'use strict';
// CommonJS includes. This is a browserify module and will run both inside Node and in the browser.
var Backbone = (window && window.Backbone) || require('backbone');
var _ = (window && window._) || require('underscore');
var querystring = require('querystring');

/**
 * Backbone.History overrides.
 * @type {Backbone.History}
 */
var QueryHistory = Backbone.History.extend( /** @lends QueryHistory# **/{

  /**
   * Override history constructor to init some properties and set the embedded query 
   * model listener.
   * @constructs
   * @type {Backbone.History}
   */
  constructor: function() {
    this.previousQuery = {};
    this.queryHandlers = [];
    this._bindToQueryObject();
    Backbone.History.call(this);
  },

  /**
   * Extracts querystrings from routes.
   * @type {RegExp}
   */
  queryMatcher: /^([^?]*?)(?:\?([\s\S]*))?$/,

  /**
   * Model emcompassing current query state. You can read and set properties
   * on this Model and `Backbone.history.navigate()` will automatically be called.
   * @type {Backbone.Model}
   */
  query: new Backbone.Model(),

  /**
   * Set up query model overrides & event bindings.
   */
  _bindToQueryObject: function() {
    this.stopListening(this.query, 'change', this.onQueryModelChange);
    this.listenTo(this.query, 'change', this.onQueryModelChange);

    // Bind a nice toString() method for use on the query object.
    this.query.toString = function() {
      return querystring.stringify(this.attributes);
    };
    // Alias resetQuery.
    this.query.reset = _.bind(this.resetQuery, this);
  },

  getBaseRoute: function() {
    return this._stripQuery(Backbone.history.fragment);
  },

  /**
   * Parse a fragment into a query object and call handlers matching.
   * @param {String} [fragment] Route fragment.
   */
  loadQuery: function(fragment) {
    if (!fragment) fragment = this.fragment;

    // Ensure the query model is up to date with the fragment. This is potentially redundant
    // but must be in place in case `loadQuery` is called directly.
    this._syncQueryModelFromFragment(fragment);

    var query = this.query.toJSON();
    var previous = this.previousQuery;

    // Save previous query. We intentionally do not use `this.query.previousAttributes()`, as
    // it can be overwritten by a user set.
    this.previousQuery = query;

    // Diff new and old queries.
    var diffs = this._getDiffs(previous, query);
    if (!diffs.length) return;

    // Call each function that subscribes to these items.
    // This is intentional, rather than fire events on each changed item;
    // this way, you don't have to debounce your handlers since they are only called once,
    // even if multiple query items change.
    _.each(this.queryHandlers, function(handler) {
      var intersections = _.intersection(diffs, handler.bindings);
      if (intersections.length) {
        handler.callback(fragment, query, intersections);
      }
    });
  },

  /**
   * Compare previous base fragment to current base fragment. If it is the same,
   * do not fire the url handler.
   *
   * This is intended so that you can use `navigate` to change a query without
   * worrying about refiring route handlers.
   * 
   * @param  {String} fragment History fragment.
   * @return {Boolean} True if a route was matched or if it hasn't changed. This allows you
   *   to still bind listeners that look for unmatched routes, e.g. backbone.routeNotFound.
   */
  loadUrl: function(fragment) {
    if (this._previousBaseFragment !== this._stripQuery(fragment)) {
      return Backbone.History.prototype.loadUrl.apply(this, arguments);
    }
    return true;
  },

  /**
   * Add loadQuery hook.
   *
   * @param {String} fragment History fragment.
   * @param {Object} options  Navigation options.
   */
  navigate: function(fragment, options) {
    if (!Backbone.History.started) return false;
    if (!options || options === true) options = {trigger: !!options};

    // Save base fragment for comparison in loadUrl.
    this._previousBaseFragment = this._stripQuery(this.fragment);

    // Call navigate on prototype.
    var ret = Backbone.History.prototype.navigate.call(this, fragment, options);

    // Synchronize query model with fragment.
    this._syncQueryModelFromFragment(this.fragment, {silent: !(options && options.trigger)});

    // Fire querystring routes after normal routes.
    if (options.trigger) {
      this.loadQuery(fragment, options);
    }

    return ret;
  },

  /**
   * Navigate a base route only, while maintaining the current query.
   * Strips any querystrings from the input fragment and appends
   * the current querystring.
   * @param  {String} fragment Route fragment.
   * @param  {Object} options  Navigation options.
   */
  navigateBase: function(fragment, options) {
    var currentQuery = this._fragmentToQueryString(Backbone.history.fragment);
    return this.navigate(this._stripQuery(fragment) + "?" + currentQuery, options);
  },

  /**
   * When the query model changes, navigate.
   * @param  {Model}  model   Attached model.
   * @param  {Object} options Change options.
   */
  onQueryModelChange: function(model, options) {
    _.defaults(options || {}, {trigger: true});
    var baseRoute = this._stripQuery(this.fragment || '');

    // Write the new querystring.
    this.navigate(baseRoute + '?' + this.query.toString(), options);
  },

  /**
   * Add a query to be tested when the fragment changes.
   * @param  {Array}   bindings  Query keys to listen to.
   * @param  {Function} callback Callback to call when these keys change.
   */
  queryHandler: function(bindings, callback) {
    this.queryHandlers.push({bindings: bindings, callback: callback});
  },

  /**
   * Reset the internal query model to a certain state. Performs set() and unset() internally
   * to reset the model's attributes to the correct state, while firing the correct events.
   * Similar to Backbone.Collection.reset(), but with model attributes rather than models.
   * @paramset Query Object
   * @param {Object} queryObject New query object.
   * @paramset Query String
   * @param {String} queryString New query string.
   */
  resetQuery: function(queryObject, options) {
    // Alternate usage
    if (_.isString(queryObject)) {
      if (queryObject.indexOf('?') === -1) queryObject = '?' + queryObject;
      queryObject = this._fragmentToQueryObject(queryObject);
    }
    if (!options) options = {};
    var queryModel = this.query;

    // Reset the current record of changes.
    queryModel._previousAttributes = _.clone(queryModel.attributes);
    queryModel.changed = {};

    // Suppresses intermediate 'change' events; 'change:key' will still fire.
    // This has the added benefit of making the internal `changed` hash actually
    // correct for this operation, which means previousAttributes() and changedAttributes()
    // will actually work correctly.
    queryModel._changing = true;

    // Unset any keys inside the existing query. To disable,
    // set `{unset: false}` in the options.
    if (options.unset !== false) {
      _.each(queryModel.attributes, function(attr, key){
        if (!queryObject[key]) queryModel.unset(key);
      });
    }

    // Set new keys. To disable, set `{set: false}` in the options.
    if (options.set !== false) {
      _.each(queryObject, function(attr, key){

        // Don't set if the stringified representation is the same. This will catch
        // single-element arrays, which is intended.
        var isSameString = _.result(queryModel.get(key), 'toString') === _.result(attr, 'toString');
        // Check if one or the other is an array - this prevents two objects from falsy
        // looking the same as they stringify to [object Object].
        // If we have nested support, we don't want to do this.
        if (!queryModel.nestedSupport && isSameString && 
          (_.isArray(queryModel.get(key)) || _.isArray(attr))) return;
        
        queryModel.set(key, attr);
      });
    }

    // Unset changing flag and fire change event.
    queryModel._changing = false;
    if (!options.silent && !_.isEmpty(queryModel.changed)){
      queryModel.trigger('change', queryModel, options);
    }
  },

  /**
   * When Backbone.history initializes, also load the current query.
   * @return {Boolean}         Route matching status from Backbone.history.loadUrl.
   */
  start: function() {
    var ret = Backbone.History.prototype.start.apply(this, arguments);
    if (!this.options.silent) this.loadQuery();
    return ret;
  },

  /**
   * Given two objects, compute their differences and list them.
   * This does not support nested objects.
   *
   * Deleted, added, or changed keys are considered diffs.
   *
   * @example
   *   _getDiffs({q: 'foo', bar: 'foo'}, {q: 'bar', bar2: 'foo'})
   *     -> ['q', 'bar', 'bar2']
   *
   * @param  {Object} lhs Left hand object.
   * @param  {Object} rhs Right hand (new) object.
   * @return {Array}      Array of string differences.
   */
  _getDiffs: function(lhs, rhs) {
    return _.chain(lhs)
      .keys()
      .concat(_.keys(rhs))
      .reduce(function(result, key){
        if (_.result(lhs[key], 'toString') !== _.result(rhs[key], 'toString')) {
          result.push(key);
        }
        return result;
      }, [])
      .uniq()
      .value();
  },

  /**
   * Given a fragment, return a query object.
   * @param  {String} fragment Route fragment.
   * @return {Object}          Query object.
   */
  _fragmentToQueryObject: function(fragment) {
    try {
      return querystring.parse(this._fragmentToQueryString(fragment));
    } catch(e) {
      throw new Error("Unable to parse fragment into query object: " + fragment);
    }
  },

  /**
   * Given a fragment, return a query string.
   * @param  {String} fragment Route fragment.
   * @return {String}          Query string.
   */
  _fragmentToQueryString: function(fragment) {
    if (!fragment) return '';
    var match = fragment.match(this.queryMatcher);
    return match[2] || '';
  },

  /**
   * Synchronize the internal query model with the fragment.
   * @param {String} fragment Route fragment.
   * @param {Object} options  Options.
   * @param {Boolean} [options.trigger] If true will not fire change events.
   */
  _syncQueryModelFromFragment: function(fragment, options) {
    // Set internal query object.
    var query = this._fragmentToQueryObject(this.fragment);

    // Set embedded model to new query object, firing 'change' events when necessary.
    this.stopListening(this.query, 'change', this.onQueryModelChange);
    this.resetQuery(query, options);
    this.listenTo(this.query, 'change', this.onQueryModelChange);
  },

  /**
   * Strip a querystring from a fragment.
   * @param  {String} fragment Route fragment.
   * @return {String}          Fragment without query.
   */
  _stripQuery: function(fragment) {
    return fragment ? fragment.split('?')[0] : '';
  }
});

var RouterProto = Backbone.Router.prototype;
/**
 * Backbone.Router overrides.
 * @type {Backbone.Router}
 */
var QueryRouter = Backbone.Router.extend(/** @lends QueryRouter# */{
  /**
   * Bind query routes.
   * 
   * Remember that handlers will only fire once per navigation. If for some reason you'd like
   * a handler to fire for each individual change, bind to the 'change:{key}' events on 
   * Backbone.history.query, which is just a Backbone.Model (and fires all of the usual
   * events).
   *
   * They are expected to be attached in the following configuration:
   * 
   * ```javascript
   * queryRoutes: [
   *   'key1,key2,key3': 'handlerName',
   *   'q, sort, rows': function() { // ... }
   * ]
   * ```
   */
  _bindRoutes: function() {
    if (!this.queryRoutes) return;
    this.queryRoutes = _.result(this, 'queryRoutes');
    var qRoute, qRoutes = _.keys(this.queryRoutes);
    while ((qRoute = qRoutes.pop()) != null) {
      this.queryHandler(qRoute, this.queryRoutes[qRoute]);
    }
    RouterProto._bindRoutes.apply(this, arguments);
  },

  /**
   * Navigate a base route only, while maintaining the current query.
   * Delegates to `Backbone.history.navigateBase`.
   * @param  {String} fragment Route fragment.
   * @param  {Object} options  Navigation options.
   */
  navigateBase: function(fragment, options) {
    Backbone.history.navigateBase(fragment, options);
    return this;
  },

  /**
   * Bind a queryHandler. Very similar to Backbone.Router#route, except that args
   * are provided by Backbone.history#queryHandler, rather than being extracted
   * in the router from the fragment.
   * @param  {String|array}  bindings Query key bindings.
   * @param  {String}   [name]        Listener name.
   * @param  {Function} callback      Listener callback.
   */
  queryHandler: function(bindings, name, callback) {
    bindings = this._normalizeBindings(bindings);
    if (_.isFunction(name)) {
      callback = name;
      name = '';
    }
    if (!callback) callback = this[name];
    if (!callback) throw new Error("QueryHandler not found: " + this[name]);
    var router = this;
    Backbone.history.queryHandler(bindings, function(fragment, queryObj, queryKeys) {
      // Emulate method signatures used on normal routes
      router.execute(callback, [queryObj, queryKeys]);
      router.trigger('route:' + name, queryKeys, queryObj);
      router.trigger('route', name, [queryObj, queryKeys]);
      Backbone.history.trigger('route', router, name, [queryObj, queryKeys]);
    });
    return this;
  },

  /**
   * Normalize bindings - convert to array and trim whitespace.
   * @param  {String} bindings Bindings definition.
   * @return {Array}           Normalized bindings.
   */
  _normalizeBindings: function(bindings) {
    if (_.isString(bindings)) {
      bindings = bindings.split(',');
    }
    return _.invoke(bindings, 'trim');
  }
});

// Override default Backbone.Router constructor.
Backbone.Router = QueryRouter;

// Replace Backbone.history.
Backbone.history = new QueryHistory();
