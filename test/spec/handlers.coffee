describe "Test incoming parameters on route handlers", ->

  if !Backbone.History.started
    Backbone.history.start();
  initialRoute = 'queryTest?foo=bar&bar=foo&nested[prop]=value&nested[prop2]=value2&nested2[prop3]=value3'
  changedRoute = 'queryTest?foo=bar&bar=baz&nested[prop]=value&nested[prop5]=value4&nested2[prop3]=value5'

  router = null
  singleHook = multipleHook = multipleNestedHook = null
  TestRouter = Backbone.Router.extend({
    queryRoutes:
      'bar': 'singleListener'
      'bar, nested': 'multipleListeners'
      'bar, nested, nested.prop, nested.prop5, nested.missingProp': 'multipleNestedListeners'

    singleListener: ->
      singleHook?.apply(this, arguments)

    multipleListeners: ->
      multipleHook?.apply(this, arguments)

    multipleNestedListeners: ->
      multipleNestedHook?.apply(this, arguments)
  })

  beforeEach ->
    Backbone.history.queryHandlers = []
    Backbone.history.navigate(initialRoute, {trigger: true})
    router = new TestRouter()

  # Here we're testing that the correct parameters come back on a route handler.
  it "Properly passes changed attrs and current query object (single)", ->
    called = false
    singleHook = (changedAttrs, queryObj) ->
      expect(changedAttrs).toEqual(['bar'])
      expect(queryObj).toEqual(_.pick(Backbone.history.query.toJSON(), 'bar'))
      called = true

    Backbone.history.navigate(changedRoute, {trigger: true})
    expect(called).toBe(true)

  it "Properly passes changed attrs and current query object (multiple)", ->
    called = false
    multipleHook = (changedAttrs, queryObj) ->
      props = ['bar', 'nested']
      expect(changedAttrs).toEqual(props)
      expect(queryObj).toEqual(_.pick(Backbone.history.query.toJSON(), props))
      called = true

    Backbone.history.navigate(changedRoute, {trigger: true})
    expect(called).toBe(true)

  it "Properly passes changed attrs and current query object (multipleNested)", ->
    called = false
    multipleNestedHook = (changedAttrs, queryObj) ->
      props = ['bar', 'nested', 'nested.prop5'] # NOT nested.missingProp (doesn't exist) or nested.prop (no change)
      expect(changedAttrs).toEqual(props)
      expect(queryObj).toEqual(_.pick(Backbone.history.query.toJSON(), props))
      called = true

    Backbone.history.navigate(changedRoute, {trigger: true})
    expect(called).toBe(true)
