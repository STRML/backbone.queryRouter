describe "Test incoming parameters on route handlers", ->

  if !Backbone.History.started
    Backbone.history.start()
  initialRoute = 'queryTest?foo=bar&bar=foo&buddy=guy'
  changedRoute = 'queryTest?foo=bar&bar=baz&buddy=pal'

  router = null
  singleHook = multipleHook = multipleNestedHook = null
  TestRouter = Backbone.Router.extend({
    queryRoutes:
      'bar': 'singleListener'
      'bar, buddy': 'multipleListeners'

    singleListener: ->
      singleHook?.apply(this, arguments)

    multipleListeners: ->
      multipleHook?.apply(this, arguments)
  })

  beforeEach ->
    Backbone.history.queryHandlers = []
    Backbone.history.navigate(initialRoute, {trigger: true})
    router = new TestRouter()

  # Here we're testing that the correct parameters come back on a route handler.
  it "Properly passes changed attrs and current query object (single)", ->
    called = false
    singleHook = (queryObj, changedAttrs) ->
      expect(changedAttrs).toEqual(['bar'])
      expect(queryObj).toEqual(Backbone.history.query.toJSON())
      called = true

    Backbone.history.navigate(changedRoute, {trigger: true})
    expect(called).toBe(true)

  it "Properly passes changed attrs and current query object (multiple)", ->
    called = false
    multipleHook = (queryObj, changedAttrs) ->
      props = ['bar', 'buddy']
      expect(changedAttrs).toEqual(props)
      expect(queryObj).toEqual(Backbone.history.query.toJSON())
      called = true

    Backbone.history.navigate(changedRoute, {trigger: true})
    expect(called).toBe(true)
