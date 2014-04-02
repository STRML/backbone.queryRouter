describe "Navigation API tests", ->

  if !Backbone.History.started
    Backbone.history.start();

  describe "Usage of navigation helpers", ->

    TestRouter = Backbone.Router.extend({
      routes: 
        'books/:title': 'viewBook'
        'albums/:songNumber': 'viewSong'  
      queryRoutes:
        'artist': 'viewArtist'
        'author': 'viewAuthor'

      initialize: ->
        this.resetCalls()
      resetCalls: ->
        this.calls = [];
      # These are difficult to spy on since they are bound immediately
      viewBook: ->
        this.calls.push('book')
      viewSong: ->
        this.calls.push('song')
      viewArtist: ->
        this.calls.push('artist')
      viewAuthor: ->
        this.calls.push('author')
    })

    router = null
    initialRoute = 'books/REAMDE?author=Neal%20Stephenson'
    Backbone.history.query.on 'all', (event) ->
      # debug(event);

    beforeEach ->
      # Reset all handlers between tests.
      Backbone.history.handlers = []
      Backbone.history.queryHandlers = []
      Backbone.history.navigate('', {trigger: true})

      # Create router & route to initial route.
      router = new TestRouter()
      Backbone.history.navigate(initialRoute, {trigger: true})
      expect(router.calls).toEqual(['book', 'author'])
      router.resetCalls()

    it "Fires correct navigation on query change", ->
      Backbone.history.navigate('books/REAMDE?author=SciFi%20Guy', {trigger: true})
      expect(router.calls).toEqual(['author'])

    it "Fires correct navigation on query change (using model)", ->
      Backbone.history.query.set({author: "SciFi Guy"})
      expect(router.calls).toEqual(['author'])

    it "Fires correct navigation on query key change", ->
      Backbone.history.navigate('books/REAMDE?artist=Book%20Riot', {trigger: true})
      # Fires author deletion, and artist addition
      expect(router.calls).toEqual(['author', 'artist'])

    it "Fires correct navigation on query key change (using model)", ->
      Backbone.history.query.set({artist: "Book Riot"})
      expect(router.calls).toEqual(['artist'])

    it "Fires correct navigation on route change", ->
      Backbone.history.navigate('books/Snow%20Crash?author=Neal%20Stephenson', {trigger: true})
      expect(router.calls).toEqual(['book'])    

    it "Fires correct navigation on route change (using helper)", ->
      Backbone.history.navigateBase('albums/1', {trigger: true})
      expect(router.calls).toEqual(['song'])

    it "Fires correct navigation on route param change (using helper)", ->
      Backbone.history.navigateBase('books/Cryptonomicon', {trigger: true})
      expect(router.calls).toEqual(['book'])

    it "Fires correct navigation on query reset (using helper)", ->
      Backbone.history.resetQuery({artist: 'Picasso'})
      expect(router.calls).toEqual(['author', 'artist'])

    it "Fires correct navigation on query reset (using helper and string)", ->
      Backbone.history.resetQuery('garbage?artist=Picasso')
      expect(router.calls).toEqual(['author', 'artist'])



