describe "Test Router creation", ->

  initialRoute = 'queryTest?foo=bar&bar=foo&nested[prop]=value&nested[prop2]=value2&nested2[prop3]=value3'
  changedRoute = 'queryTest?foo=bar&bar=baz&nested[prop]=value&nested[prop5]=value4&nested2[prop3]=value5'

  describe "Test firing of declarative routes", ->

    queryCb = TestRouter = null
    beforeEach ->
      Backbone.history.navigate(initialRoute, {trigger: true})
      Backbone.history.queryHandlers = [];
      queryCb = jasmine.createSpy('queryCb')
      TestRouter = Backbone.Router.extend({
        testRoute: queryCb
      })

    afterEach ->
      router = new TestRouter()
      Backbone.history.navigate(changedRoute, {trigger: true})
      expect(queryCb).toHaveBeenCalled()

    it "Accepts simple declarative syntax", ->
      TestRouter.prototype.queryRoutes = {
        'bar': 'testRoute'
      }

    # TODO more complicated routes

  # TODO test that route:name-style events are properly being thrown from declarative
  # and imperative syntax
