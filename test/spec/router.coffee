describe "Test Router creation", ->

  if !Backbone.History.started
    Backbone.history.start()
  initialRoute = 'queryTest?foo=bar&bar=foo&buddy=guy'
  changedRoute = 'queryTest?foo=bar&bar=baz&buddy=pal'

  describe "Test firing of declarative routes", ->

    queryCb = TestRouter = null
    beforeEach ->
      Backbone.history.navigate(initialRoute, {trigger: true})
      Backbone.history.queryHandlers = []
      queryCb = jasmine.createSpy('queryCb')
      TestRouter = Backbone.Router.extend({
        testRoute: queryCb
      })

    afterEach ->
      router = new TestRouter()
      Backbone.history.navigate(changedRoute, {trigger: true})
      expect(queryCb.calls.count()).toEqual(1)

    it "Accepts simple declarative syntax", ->
      TestRouter.prototype.queryRoutes = {
        'bar': 'testRoute'
      }

    it "Multiple changes only cause one call", ->
      TestRouter.prototype.queryRoutes = {
        'bar, buddy': 'testRoute'
      }

  # TODO test that route:name-style events are properly being thrown from declarative
  # and imperative syntax
