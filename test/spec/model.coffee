describe "Test model change events & query modulation", ->

  if !Backbone.History.started
    Backbone.history.start()
  initialRoute = 'queryTest?foo=bar&bar=foo&buddy=guy'
  changedRoute = 'queryTest?foo=bar&bar=baz&buddy=pal'
  changedProps =
    foo: 'bar'
    bar: 'baz'
    buddy: 'pal'

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
      Backbone.history.resetQuery(changedProps)
      expect(queryCb.calls.count()).toEqual(1)

    it "Accepts simple declarative syntax", ->
      TestRouter.prototype.queryRoutes = {
        'bar': 'testRoute'
      }

    it "Multiple changes only cause one call", ->
      TestRouter.prototype.queryRoutes = {
        'bar, buddy': 'testRoute'
      }

