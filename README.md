Backbone.queryRouter
====================

Execute multiple routes per URL change using querystring properties.

Download
--------

For browsers:

[Development Version](dist/backbone.queryRouter.browser.js) 

[Production Version](dist/backbone.queryRouter.browser.min.js)

For Node:

```bash
npm install backbone.queryRouter
```

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

TODO

Documentation
-------------

Generated documentation is [available here](raw/master/doc/src/backbone.queryRouter.js.html).

Helper Functions
----------------

Backbone.queryRouter comes with a few helper functions that help you modify the current URL.

TODO describe `changeBaseRoute`

TODO describe `add/remove/set/replaceQuery`
FIXME use a backbone model for state?
