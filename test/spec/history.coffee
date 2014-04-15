describe "Test listening to browser back/forward", ->

  if !Backbone.History.started
    Backbone.history.start()
  initialRoute = 'queryTest?foo=baz&bar=foo'
  changedRoute = 'queryTest?foo=bar&bar=baz'

  router = null
  hook1 = hook2 = null
  TestRouter = Backbone.Router.extend({
    queryRoutes:
      'foo': 'listener1'
      'bar': 'listener2'

    listener1: ->
      hook1?.apply(this, arguments)

    listener2: ->
      console.error('listener2')
      hook2?.apply(this, arguments)
  })

  beforeEach ->
    Backbone.history.queryHandlers = []
    router = new TestRouter()
    Backbone.history.navigate(initialRoute, {trigger: true})
    Backbone.history.navigate(changedRoute, {trigger: true})

  afterEach ->
    # Cleanup
    Backbone.history.handlers = []
    Backbone.history.queryHandlers = []

  it "Properly navigates back on a hashchange", (done) ->

    hook2 = (queryObj, changedAttrs) ->
      expect(changedAttrs).toEqual(['bar'])
      done()

    window.location.hash = '#queryTest?bar=boof'
