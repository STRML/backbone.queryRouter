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

  describe "Model reset tests", ->

    it "Only fires one change event if reset with the same props", ->
      model = Backbone.history.query
      changeSpy = jasmine.createSpy('changeSpy')
      
      model.on('change', changeSpy)
      model.reset({foo: 'bar', baz: 'biff'})
      expect(changeSpy).toHaveBeenCalled()
      
      model.reset({foo: 'bar', baz: 'biff'})
      model.reset({foo: 'bar', baz: 'biff'})
      expect(changeSpy.calls.count()).toBe(1)

    it "Accepts 'keys' option", ->
      model = Backbone.history.query
      attrs = {a: 'b', b: 'c', foo: 'bar'}
      model.reset(attrs)
      expect(model.attributes).toEqual(attrs)

      model.reset({a: 'c', b: 'd'}, {keys: ['a', 'b']})
      expect(model.attributes).toEqual({a: 'c', b: 'd', foo: 'bar'})

