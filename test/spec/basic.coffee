describe "Backbone.queryRouter tests", ->

  describe "Test query matching", ->

    beforeEach ->
      Backbone.history.navigate('queryTest?foo=bar&nested[prop]=value', {trigger: true})

    it "Listens to a basic query change", ->
      debugger;
      queryCb = jasmine.createSpy('queryCb')
      Backbone.history.queryHandler(['foo'], queryCb)
      Backbone.history.navigate('queryTest?foo=baz', {trigger: true})
      expect(queryCb).toHaveBeenCalled()

    it "Listened to the parent of a nested change", ->
      queryCb = jasmine.createSpy('queryCb')
      Backbone.history.queryHandler(['nested'], queryCb)
      Backbone.history.navigate('queryTest?foo=baz', {trigger: true})
      expect(queryCb).toHaveBeenCalled()

    it "Listened to the child of a nested change", ->
      queryCb = jasmine.createSpy('queryCb')
      Backbone.history.queryHandler(['nested.prop'], queryCb)
      Backbone.history.navigate('queryTest?foo=baz', {trigger: true})
      expect(queryCb).toHaveBeenCalled()
