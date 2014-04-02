Backbone.queryRouter
====================

Execute multiple routes per URL change using watches on querystring keys. Drop-in plugin for Backbone;
existing routers may remain unchanged, but you gain querystring-based routing via the new 
`queryRoutes` property.

Download
--------

For browsers:

[Development Version](dist/backbone.queryRouter.browser.js) 

[Production Version](dist/backbone.queryRouter.browser.min.js)

For Node:

```bash
npm install backbone.queryrouter
```

For eyeballs:

[Readable Source](src/backbone.queryRouter.js)

[Docs](http://strml.github.io/backbone.queryRouter/src/backbone.queryRouter.js.html)

Description
-----------

Modern web applications have many moving parts, and traditional webapp routing is far too restrictive
to deal with real-world apps.

A modern webapp may have many independent bits of serializable state that must be correctly transmitted
when a URL is sent to another user. For example, a music app may want to send the current song, position within
the song, and location within a browsing window. A search app may want to transmit the current query,
selected results, expansion of those results, and user preferences.

It is not always possible to store complex state in localStorage or cookies, if you want to transmit that
complex state to other users via a URL. It can very quickly become unwieldy to create massive 'multi-routes',
where sections of the URL delegate to subrouters. Every time a new widget with state is added, a new 
section must be added to the route, and all links updated. `There has to be a better way!`

Querystrings are a perfect solution to this problem, and with HTML5 pushState, they can easily be used
on the client and the server.

Usage
-----

To create a router supporting query changes, use the following format:

```javascript
var QueryAwareRouter = Backbone.Router.extend({

  // Normal routes definition - this is unchanged.
  routes: {
    'books/:bookID': 'viewBook',
    'albums/:songNumber': 'viewSong'
  },

  // QueryRoutes are defined here. They are defined in the format:
  // {String} keys : {String} handlerName
  queryRoutes: {
    // Here you can specify which keys you want to listen to.
    // The attached handler will be fired each time any of the keys are 
    // added, removed, or changed.
    'volume': 'setVolume',
    // To listen to multiple keys, separate them with commas. Whitespace is ignored.
    'playState, songID' : 'playSong'
  },

  // Each queryHandler is called with two parameters:
  // @param {Array} changedKeys Array of changed keys that caused this handler to fire.
  // @param {Object} queryObj   Subset of current query containing the keys 
  //                            in `changedKeys`. To get the full query, 
  //                            use `Backbone.history.query.toJSON()`
  setVolume: function(changedKeys, queryObj) {
    // e.g. if the query is changed to '?songID=foo&volume=100', 
    // `changedKeys = ['volume']` and `queryObj = {volume: '100'}`
  },

  playSong: function(changedKeys, queryObj) {
    // e.g. if the query is changed to '?songID=foo&volume=100', 
    // `changedKeys = ['songID']` and `queryObj = {songID: 'foo'}`
  },

  // ... more handlers ...
});

```

Documentation
-------------

Generated documentation is [available here](http://strml.github.io/backbone.queryRouter/src/backbone.queryRouter.js.html).

Helper Functions
----------------

Backbone.queryRouter comes with a few helper functions that help you modify the current URL.

### Backbone.history.navigateBase(String route, Object options)

Usage: `Backbone.history.navigateBase('/newRoute', {trigger: true});`

Useful when you want to change the base route and fire a route handler, but you don't want
to change the current query. No query handlers will be fired and the query in the URL bar
will remain unchanged.

### Backbone.history.getBaseRoute() -> String

Returns current base route (fragment without querystring).

### Backbone.history.query -> Backbone.Model

Usage:

```javascript
Backbone.history.query.set(attributes, [options])
Backbone.history.query.unset(attributes, [options])
Backbone.history.query.clear()
Backbone.history.query.toString()
```

The current query is attached to Backbone.history as a simple Backbone.Model. It supports
all of the usual Backbone.Model methods and events. Changing attributes on the query
will automatically fire the associated query handlers, much like calling 
`Backbone.history.navigate(route, {trigger:true})`.

Call `Backbone.history.query.toString()` to get the current query string.

### Backbone.history.resetQuery(Object|String query)

Usage: 

```javascript
Backbone.history.resetQuery({key: 'value', nested: {key2: 'value2'}})
Backbone.history.resetQuery("?key=value&nested[key2]=value2")
Backbone.history.resetQuery("ignored/fragment?key=value&nested[key2]=value2")
```

Resets the current query value to an entirely new value. Optionally accepts a query string with or
without a leading `?`, and will automatically extract the querystring if you pass it a full
route fragment. If you pass this method a querystring containing a `?` in a key or value, 
you must include the leading `?` or the querystring will be misparsed.

This method is similar to `Backbone.Collection.reset`; it fires the appropriate `set` and
`unset` methods, including the associated change events (for change events on nested attributes,
see 'Gotchas' below). Only a single `change` event will be thrown, so there is no need to 
debounce your handlers.

Gotchas
-------

While Backbone.queryRouter supports binding to nested attributes, the embedded query model
does not support firing change events on nested attributes. If you require this, simply
include [Backbone.NestedModel](https://github.com/afeld/backbone-nested) before this
script and the proper events will automatically be thrown.
