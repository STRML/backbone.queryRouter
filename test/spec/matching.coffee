describe "Test query matching", ->

  if !Backbone.History.started
    Backbone.history.start()
  initialRoute = 'queryTest?foo=bar&bar=foo&buddy=guy'
  changedRoute = 'queryTest?foo=bar&bar=baz&buddy=pal'

  describe "Positive query matching", ->

    queryCb = null
    beforeEach ->
      Backbone.history.navigate(initialRoute, {trigger: true})
      Backbone.history.queryHandlers = []
      queryCb = jasmine.createSpy('queryCb')

    afterEach ->
      Backbone.history.navigate(changedRoute, {trigger: true})
      expect(queryCb).toHaveBeenCalled()

    it "Listens to a basic query change", ->
      Backbone.history.queryHandler(['bar'], queryCb)

  describe "Negative query matching", ->

    queryCb = null
    beforeEach ->
      Backbone.history.navigate(initialRoute, {trigger: true})
      Backbone.history.queryHandlers = []
      queryCb = jasmine.createSpy('queryCb')

    afterEach ->
      Backbone.history.navigate(changedRoute, {trigger: true})
      expect(queryCb).not.toHaveBeenCalled()

    it "Doesn't fire if the value listened to doesn't exist", ->
      Backbone.history.queryHandler(['notHere'], queryCb)

    it "Doesn't fire if the value listened to hasn't changed", ->
      Backbone.history.queryHandler(['foo'], queryCb)

    # Backbone compat, Backbone.history.route does not do any regex logic,
    # we don't want to encourage this
    it "Should not accept a string instead of an array", ->
      Backbone.history.queryHandler('bar', queryCb)
