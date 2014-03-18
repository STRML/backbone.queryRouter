describe "Test model change events & query modulation", ->

  if !Backbone.History.started
    Backbone.history.start();
  initialRoute = 'queryTest?foo=bar&bar=foo&nested[prop]=value&nested[prop2]=value2&nested2[prop3]=value3'
  changedRoute = 'queryTest?foo=bar&bar=baz&nested[prop]=value&nested[prop5]=value4&nested2[prop3]=value5'
  changedProps = {
    foo: 'bar'
    bar: 'baz'
    nested:
      prop: 'value'
      prop5: 'value4'
    nested2:
      prop3: 'value5'
  }

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
      Backbone.history.query.set(changedProps)
      expect(queryCb.calls.count()).toEqual(1)

    it "Accepts simple declarative syntax", ->
      TestRouter.prototype.queryRoutes = {
        'bar': 'testRoute'
      }

    it "Works with comma-separated listeners", ->
      TestRouter.prototype.queryRoutes = {
        'foo, nested': 'testRoute'
      }

    it "Multiple changes only cause one call", ->
      TestRouter.prototype.queryRoutes = {
        'bar, nested, nested2, nested.prop2, nested.prop, nested2.prop3': 'testRoute'
      }

    # TODO more complicated routes
    it "Works on parent of nested child (add/remove)", ->
      TestRouter.prototype.queryRoutes = {
        'nested': 'testRoute'
      }

    it "Works on parent of nested child (change)", ->
      TestRouter.prototype.queryRoutes = {
        'nested2': 'testRoute'
      }

    it "Works on nested child (removal)", ->
      TestRouter.prototype.queryRoutes = {
        'nested.prop2': 'testRoute'
      }

    it "Works on nested child (add)", ->
      TestRouter.prototype.queryRoutes = {
        'nested.prop5': 'testRoute'
      }

    it "Works on nested child (change)", ->
      TestRouter.prototype.queryRoutes = {
        'nested2.prop3': 'testRoute'
      }

