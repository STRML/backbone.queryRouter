require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
;(function(undefined) {
	"use strict";

	var $scope
	, conflict, conflictResolution = [];
	if (typeof global == 'object' && global) {
		$scope = global;
	} else if (typeof window !== 'undefined'){
		$scope = window;
	} else {
		$scope = {};
	}
	conflict = $scope.DeepDiff;
	if (conflict) {
		conflictResolution.push(
			function() {
				if ('undefined' !== typeof conflict && $scope.DeepDiff === accumulateDiff) {
					$scope.DeepDiff = conflict;
					conflict = undefined;
				}
			});
	}

	// nodejs compatible on server side and in the browser.
  function inherits(ctor, superCtor) {
    ctor.super_ = superCtor;
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  }

  function Diff(kind, path) {
  	Object.defineProperty(this, 'kind', { value: kind, enumerable: true });
  	if (path && path.length) {
  		Object.defineProperty(this, 'path', { value: path, enumerable: true });
  	}
  }

  function DiffEdit(path, origin, value) {
  	DiffEdit.super_.call(this, 'E', path);
  	Object.defineProperty(this, 'lhs', { value: origin, enumerable: true });
  	Object.defineProperty(this, 'rhs', { value: value, enumerable: true });
  }
  inherits(DiffEdit, Diff);

  function DiffNew(path, value) {
  	DiffNew.super_.call(this, 'N', path);
  	Object.defineProperty(this, 'rhs', { value: value, enumerable: true });
  }
  inherits(DiffNew, Diff);

  function DiffDeleted(path, value) {
  	DiffDeleted.super_.call(this, 'D', path);
  	Object.defineProperty(this, 'lhs', { value: value, enumerable: true });
  }
  inherits(DiffDeleted, Diff);

  function DiffArray(path, index, item) {
  	DiffArray.super_.call(this, 'A', path);
  	Object.defineProperty(this, 'index', { value: index, enumerable: true });
  	Object.defineProperty(this, 'item', { value: item, enumerable: true });
  }
  inherits(DiffArray, Diff);

  function arrayRemove(arr, from, to) {
  	var rest = arr.slice((to || from) + 1 || arr.length);
  	arr.length = from < 0 ? arr.length + from : from;
  	arr.push.apply(arr, rest);
  	return arr;
  }

  function deepDiff(lhs, rhs, changes, path, key, stack) {
  	path = path || [];
  	var currentPath = path.slice(0);
  	if (key) { currentPath.push(key); }
  	var ltype = typeof lhs;
  	var rtype = typeof rhs;
  	if (ltype === 'undefined') {
  		if (rtype !== 'undefined') {
  			changes(new DiffNew(currentPath, rhs ));
  		}
  	} else if (rtype === 'undefined') {
  		changes(new DiffDeleted(currentPath, lhs));
  	} else if (ltype !== rtype) {
  		changes(new DiffEdit(currentPath, lhs, rhs));
  	} else if (lhs instanceof Date && rhs instanceof Date && ((lhs-rhs) != 0) ) {
  		changes(new DiffEdit(currentPath, lhs, rhs));
  	} else if (ltype === 'object' && lhs != null && rhs != null) {
  		stack = stack || [];
  		if (stack.indexOf(lhs) < 0) {
  			stack.push(lhs);
  			if (Array.isArray(lhs)) {
  				var i
  				, len = lhs.length
  				, ea = function(d) {
  					changes(new DiffArray(currentPath, i, d));
  				};
  				for(i = 0; i < lhs.length; i++) {
  					if (i >= rhs.length) {
  						changes(new DiffArray(currentPath, i, new DiffDeleted(undefined, lhs[i])));
  					} else {
  						deepDiff(lhs[i], rhs[i], ea, [], null, stack);
  					}
  				}
  				while(i < rhs.length) {
  					changes(new DiffArray(currentPath, i, new DiffNew(undefined, rhs[i++])));
  				}
  			} else {
  				var akeys = Object.keys(lhs);
  				var pkeys = Object.keys(rhs);
  				akeys.forEach(function(k) {
  					var i = pkeys.indexOf(k);
  					if (i >= 0) {
  						deepDiff(lhs[k], rhs[k], changes, currentPath, k, stack);
  						pkeys = arrayRemove(pkeys, i);
  					} else {
  						deepDiff(lhs[k], undefined, changes, currentPath, k, stack);
  					}
  				});
  				pkeys.forEach(function(k) {
  					deepDiff(undefined, rhs[k], changes, currentPath, k, stack);
  				});
  			}
  			stack.length = stack.length - 1;
  		}
  	} else if (lhs !== rhs) {
  		changes(new DiffEdit(currentPath, lhs, rhs));
  	}
  }

  function accumulateDiff(lhs, rhs, accum) {
  	accum = accum || [];
  	deepDiff(lhs, rhs, function(diff) {
  		if (diff) {
  			accum.push(diff);
  		}
  	});
  	return (accum.length) ? accum : undefined;
  }

	function applyArrayChange(arr, index, change) {
		if (change.path && change.path.length) {
			// the structure of the object at the index has changed...
			var it = arr[index], i, u = change.path.length - 1;
			for(i = 0; i < u; i++){
				it = it[change.path[i]];
			}
			switch(change.kind) {
				case 'A':
					// Array was modified...
					// it will be an array...
					applyArrayChange(it, change.index, change.item);
					break;
				case 'D':
					// Item was deleted...
					delete it[change.path[i]];
					break;
				case 'E':
				case 'N':
					// Item was edited or is new...
					it[change.path[i]] = change.rhs;
					break;
			}
		} else {
			// the array item is different...
			switch(change.kind) {
				case 'A':
					// Array was modified...
					// it will be an array...
					applyArrayChange(arr[index], change.index, change.item);
					break;
				case 'D':
					// Item was deleted...
					arr = arrayRemove(arr, index);
					break;
				case 'E':
				case 'N':
					// Item was edited or is new...
					arr[index] = change.rhs;
					break;
			}
		}
		return arr;
	}

	function applyChange(target, source, change) {
		if (!(change instanceof Diff)) {
			throw new TypeError('[Object] change must be instanceof Diff');
		}
		if (target && source && change) {
			var it = target, i, u;
			u = change.path.length - 1;
			for(i = 0; i < u; i++){
				if (typeof it[change.path[i]] === 'undefined') {
					it[change.path[i]] = {};
				}
				it = it[change.path[i]];
			}
			switch(change.kind) {
				case 'A':
					// Array was modified...
					// it will be an array...
					applyArrayChange(it[change.path[i]], change.index, change.item);
					break;
				case 'D':
					// Item was deleted...
					delete it[change.path[i]];
					break;
				case 'E':
				case 'N':
					// Item was edited or is new...
					it[change.path[i]] = change.rhs;
					break;
				}
			}
		}

	function applyDiff(target, source, filter) {
		if (target && source) {
			var onChange = function(change) {
				if (!filter || filter(target, source, change)) {
					applyChange(target, source, change);
				}
			};
			deepDiff(target, source, onChange);
		}
	}

	Object.defineProperties(accumulateDiff, {

		diff: { value: accumulateDiff, enumerable:true },
		observableDiff: { value: deepDiff, enumerable:true },
		applyDiff: { value: applyDiff, enumerable:true },
		applyChange: { value: applyChange, enumerable:true },
		isConflict: { get: function() { return 'undefined' !== typeof conflict; }, enumerable: true },
		noConflict: {
			value: function () {
				if (conflictResolution) {
					conflictResolution.forEach(function (it) { it(); });
					conflictResolution = null;
				}
				return accumulateDiff;
			},
			enumerable: true
		}
	});

	if (typeof module != 'undefined' && module && typeof exports == 'object' && exports && module.exports === exports) {
		module.exports = accumulateDiff; // nodejs
	} else {
		$scope.DeepDiff = accumulateDiff; // other... browser?
	}
}());


}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],"pKsUdP":[function(require,module,exports){
/**
 * Object#toString() ref for stringify().
 */

var toString = Object.prototype.toString;

/**
 * Object#hasOwnProperty ref
 */

var hasOwnProperty = Object.prototype.hasOwnProperty;

/**
 * Array#indexOf shim.
 */

var indexOf = typeof Array.prototype.indexOf === 'function'
  ? function(arr, el) { return arr.indexOf(el); }
  : function(arr, el) {
      for (var i = 0; i < arr.length; i++) {
        if (arr[i] === el) return i;
      }
      return -1;
    };

/**
 * Array.isArray shim.
 */

var isArray = Array.isArray || function(arr) {
  return toString.call(arr) == '[object Array]';
};

/**
 * Object.keys shim.
 */

var objectKeys = Object.keys || function(obj) {
  var ret = [];
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      ret.push(key);
    }
  }
  return ret;
};

/**
 * Array#forEach shim.
 */

var forEach = typeof Array.prototype.forEach === 'function'
  ? function(arr, fn) { return arr.forEach(fn); }
  : function(arr, fn) {
      for (var i = 0; i < arr.length; i++) fn(arr[i]);
    };

/**
 * Array#reduce shim.
 */

var reduce = function(arr, fn, initial) {
  if (typeof arr.reduce === 'function') return arr.reduce(fn, initial);
  var res = initial;
  for (var i = 0; i < arr.length; i++) res = fn(res, arr[i]);
  return res;
};

/**
 * Cache non-integer test regexp.
 */

var isint = /^[0-9]+$/;

function promote(parent, key) {
  if (parent[key].length == 0) return parent[key] = {}
  var t = {};
  for (var i in parent[key]) {
    if (hasOwnProperty.call(parent[key], i)) {
      t[i] = parent[key][i];
    }
  }
  parent[key] = t;
  return t;
}

function parse(parts, parent, key, val) {
  var part = parts.shift();
  
  // illegal
  if (Object.getOwnPropertyDescriptor(Object.prototype, key)) return;
  
  // end
  if (!part) {
    if (isArray(parent[key])) {
      parent[key].push(val);
    } else if ('object' == typeof parent[key]) {
      parent[key] = val;
    } else if ('undefined' == typeof parent[key]) {
      parent[key] = val;
    } else {
      parent[key] = [parent[key], val];
    }
    // array
  } else {
    var obj = parent[key] = parent[key] || [];
    if (']' == part) {
      if (isArray(obj)) {
        if ('' != val) obj.push(val);
      } else if ('object' == typeof obj) {
        obj[objectKeys(obj).length] = val;
      } else {
        obj = parent[key] = [parent[key], val];
      }
      // prop
    } else if (~indexOf(part, ']')) {
      part = part.substr(0, part.length - 1);
      if (!isint.test(part) && isArray(obj)) obj = promote(parent, key);
      parse(parts, obj, part, val);
      // key
    } else {
      if (!isint.test(part) && isArray(obj)) obj = promote(parent, key);
      parse(parts, obj, part, val);
    }
  }
}

/**
 * Merge parent key/val pair.
 */

function merge(parent, key, val){
  if (~indexOf(key, ']')) {
    var parts = key.split('[')
      , len = parts.length
      , last = len - 1;
    parse(parts, parent, 'base', val);
    // optimize
  } else {
    if (!isint.test(key) && isArray(parent.base)) {
      var t = {};
      for (var k in parent.base) t[k] = parent.base[k];
      parent.base = t;
    }
    set(parent.base, key, val);
  }

  return parent;
}

/**
 * Compact sparse arrays.
 */

function compact(obj) {
  if ('object' != typeof obj) return obj;

  if (isArray(obj)) {
    var ret = [];

    for (var i in obj) {
      if (hasOwnProperty.call(obj, i)) {
        ret.push(obj[i]);
      }
    }

    return ret;
  }

  for (var key in obj) {
    obj[key] = compact(obj[key]);
  }

  return obj;
}

/**
 * Parse the given obj.
 */

function parseObject(obj){
  var ret = { base: {} };

  forEach(objectKeys(obj), function(name){
    merge(ret, name, obj[name]);
  });

  return compact(ret.base);
}

/**
 * Parse the given str.
 */

function parseString(str){
  var ret = reduce(String(str).split('&'), function(ret, pair){
    var eql = indexOf(pair, '=')
      , brace = lastBraceInKey(pair)
      , key = pair.substr(0, brace || eql)
      , val = pair.substr(brace || eql, pair.length)
      , val = val.substr(indexOf(val, '=') + 1, val.length);

    // ?foo
    if ('' == key) key = pair, val = '';
    if ('' == key) return ret;

    return merge(ret, decode(key), decode(val));
  }, { base: {} }).base;

  return compact(ret);
}

/**
 * Parse the given query `str` or `obj`, returning an object.
 *
 * @param {String} str | {Object} obj
 * @return {Object}
 * @api public
 */

exports.parse = function(str){
  if (null == str || '' == str) return {};
  return 'object' == typeof str
    ? parseObject(str)
    : parseString(str);
};

/**
 * Turn the given `obj` into a query string
 *
 * @param {Object} obj
 * @return {String}
 * @api public
 */

var stringify = exports.stringify = function(obj, prefix) {
  if (isArray(obj)) {
    return stringifyArray(obj, prefix);
  } else if ('[object Object]' == toString.call(obj)) {
    return stringifyObject(obj, prefix);
  } else if ('string' == typeof obj) {
    return stringifyString(obj, prefix);
  } else {
    return prefix + '=' + encodeURIComponent(String(obj));
  }
};

/**
 * Stringify the given `str`.
 *
 * @param {String} str
 * @param {String} prefix
 * @return {String}
 * @api private
 */

function stringifyString(str, prefix) {
  if (!prefix) throw new TypeError('stringify expects an object');
  return prefix + '=' + encodeURIComponent(str);
}

/**
 * Stringify the given `arr`.
 *
 * @param {Array} arr
 * @param {String} prefix
 * @return {String}
 * @api private
 */

function stringifyArray(arr, prefix) {
  var ret = [];
  if (!prefix) throw new TypeError('stringify expects an object');
  for (var i = 0; i < arr.length; i++) {
    ret.push(stringify(arr[i], prefix + '[' + i + ']'));
  }
  return ret.join('&');
}

/**
 * Stringify the given `obj`.
 *
 * @param {Object} obj
 * @param {String} prefix
 * @return {String}
 * @api private
 */

function stringifyObject(obj, prefix) {
  var ret = []
    , keys = objectKeys(obj)
    , key;

  for (var i = 0, len = keys.length; i < len; ++i) {
    key = keys[i];
    if ('' == key) continue;
    if (null == obj[key]) {
      ret.push(encodeURIComponent(key) + '=');
    } else {
      ret.push(stringify(obj[key], prefix
        ? prefix + '[' + encodeURIComponent(key) + ']'
        : encodeURIComponent(key)));
    }
  }

  return ret.join('&');
}

/**
 * Set `obj`'s `key` to `val` respecting
 * the weird and wonderful syntax of a qs,
 * where "foo=bar&foo=baz" becomes an array.
 *
 * @param {Object} obj
 * @param {String} key
 * @param {String} val
 * @api private
 */

function set(obj, key, val) {
  var v = obj[key];
  if (Object.getOwnPropertyDescriptor(Object.prototype, key)) return;
  if (undefined === v) {
    obj[key] = val;
  } else if (isArray(v)) {
    v.push(val);
  } else {
    obj[key] = [v, val];
  }
}

/**
 * Locate last brace in `str` within the key.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function lastBraceInKey(str) {
  var len = str.length
    , brace
    , c;
  for (var i = 0; i < len; ++i) {
    c = str[i];
    if (']' == c) brace = false;
    if ('[' == c) brace = true;
    if ('=' == c && !brace) return i;
  }
}

/**
 * Decode `str`.
 *
 * @param {String} str
 * @return {String}
 * @api private
 */

function decode(str) {
  try {
    return decodeURIComponent(str.replace(/\+/g, ' '));
  } catch (err) {
    return str;
  }
}

},{}],"querystring":[function(require,module,exports){
module.exports=require('pKsUdP');
},{}],4:[function(require,module,exports){
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
   * @param  {Object} options Change options (currently ignored).
   */
  onQueryModelChange: function(model, options) {
    var baseRoute = this._stripQuery(this.fragment || '');

    // Write the new querystring.
    this.navigate(baseRoute + '?' + this.query.toString(), {trigger: true});
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

},{"backbone":false,"querystring":"pKsUdP","underscore":false}],5:[function(require,module,exports){
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
Backbone.history.query = Backbone.NestedModel ? 
  new Backbone.NestedModel() : new Backbone.Model();
Backbone.history.query.nestedSupport = true;
Backbone.history._bindToQueryObject();


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

},{"backbone":false,"deep-diff":1,"underscore":false}]},{},[4,5])