describe "Test incoming parameters on route handlers (nested)", ->

  if !Backbone.History.started
    Backbone.history.start()
  initialRoute = 'queryTest?foo=bar&bar=foo&nested[prop]=value&nested[prop2]=value2&nested2[prop3]=value3'
  changedRoute = 'queryTest?foo=bar&bar=baz&nested[prop]=value&nested[prop5]=value4&nested2[prop3]=value5'

  router = null
  multipleNestedHook = null
  TestRouter = Backbone.Router.extend({
    queryRoutes:
      'bar, nested, nested.prop, nested.prop5, nested.missingProp': 'multipleNestedListeners'

    multipleNestedListeners: ->
      multipleNestedHook?.apply(this, arguments)
  })

  beforeEach ->
    Backbone.history.queryHandlers = []
    Backbone.history.navigate(initialRoute, {trigger: true})
    router = new TestRouter()

  it "Properly passes changed attrs and current query object (multipleNested)", ->
    called = false
    multipleNestedHook = (queryObj, changedAttrs) ->
      # NOT nested.missingProp (doesn't exist) or nested.prop (no change)
      props = ['bar', 'nested', 'nested.prop5']
      expect(changedAttrs).toEqual(props)
      expect(queryObj).toEqual(Backbone.history.query.toJSON())
      called = true

    Backbone.history.navigate(changedRoute, {trigger: true})
    expect(called).toBe(true)
