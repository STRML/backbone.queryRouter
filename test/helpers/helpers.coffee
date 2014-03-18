# So sick of calling JSON.stringify
window.debug = (obj...) ->
  helper = (input) ->
    if input == Object(input)
      return JSON.stringify(input)
    else 
      return input

  if obj.length > 1
    out = obj.reduce (result, val) -> result + " " + helper(val)
  else
    out = helper(obj[0])

  console.error(out)




# come on guys, I thought you knew better don't copy that floppy
RegExp.prototype.toJSON = ->
  this.toString()
