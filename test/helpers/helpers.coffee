# So sick of calling JSON.stringify
window.debug = (obj) ->
  if arguments.length > 1
    window.debug argument for argument in arguments
    return
  if obj == Object(obj)
    console.error JSON.stringify(obj)
  else 
    console.error obj

# come on guys, I thought you knew better don't copy that floppy
RegExp.prototype.toJSON = ->
  this.toString()
