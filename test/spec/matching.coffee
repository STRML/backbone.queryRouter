describe "Test query matching", ->

  if !Backbone.History.started
    Backbone.history.start();
  initialRoute = 'queryTest?foo=bar&bar=foo&nested[prop]=value&nested[prop2]=value2&nested2[prop3]=value3'
  changedRoute = 'queryTest?foo=bar&bar=baz&nested[prop]=value&nested[prop5]=value4&nested2[prop3]=value5'

  describe "Positive query matching", ->

    queryCb = null
    beforeEach ->
      Backbone.history.navigate(initialRoute, {trigger: true})
      Backbone.history.queryHandlers = [];
      queryCb = jasmine.createSpy('queryCb')

    afterEach ->
      Backbone.history.navigate(changedRoute, {trigger: true})
      expect(queryCb).toHaveBeenCalled()

    it "Listens to a basic query change", ->
      Backbone.history.queryHandler(['bar'], queryCb)

    it "Listens to an changed object value", ->
      Backbone.history.queryHandler(['nested'], queryCb)

    it "Listens to a removed child change", ->
      Backbone.history.queryHandler(['nested.prop2'], queryCb)

    it "Listens to an added child change", ->
      Backbone.history.queryHandler(['nested.prop5'], queryCb)

    it "Listens to a changed value of a child", ->
      Backbone.history.queryHandler(['nested2.prop3'], queryCb)


  describe "Negative query matching", ->

    queryCb = null
    beforeEach ->
      Backbone.history.navigate(initialRoute, {trigger: true})
      Backbone.history.queryHandlers = [];
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

    it "Doesn't fire on an unchanged object value", ->
      Backbone.history.queryHandler(['nested.prop'], queryCb)

    it "Doesn't fire on a missing object value", ->
      Backbone.history.queryHandler(['nested.notHere'], queryCb)
