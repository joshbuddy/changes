function Part(length, words, meta) {
  this.length = length
  this.words = words
  this.meta = meta
  this.reset()
}

Part.prototype.reset = function() {
  this.position = 0
  this.wordPosition = 0
  this.remainingLength = this.length
}

Part.prototype.current = function() {
  return this.words[this.wordPosition]
}

Part.prototype.advance = function() {
  var word = this.current()
  this.position += word.length
  this.wordPosition++
  this.remainingLength = this.length - this.position
  return word
}

function PlainParser(source, meta) {
  return new Part(source.length, source.split(/\b/), meta)
}

function HTMLParser(source, meta) {
  return new Part(source.length, source.split(/<.*?>|\b/), meta)
}

function Changes(opts) {
  this.parts = []
  this.parser = opts && opts.parser || PlainParser
}

Changes.prototype.addPart = function(source, meta) {
  this.parts.push(this.parser(source, meta))
}

Changes.prototype.remainingLengths = function() {
  return _.map(this.parts, function(part) { return part.remainingLength })
}

Changes.prototype.remainingSum = function(positions) {
  return _.reduce(this.parts, function(memo, part){ return memo + part.remainingLength }, 0);
}

Changes.prototype.render = function(cb) {
  var parts = this.parts
  var changes = []
  while (this.remainingSum() != 0) {
    var lengths = this.remainingLengths()
    var maxRemainingLength = _.max(lengths)
    var index = 0;
    var maxPart = _.find(parts, function(part, i) { index = i; return part.remainingLength == maxRemainingLength})
    var startIndex = index, endIndex = index
    var word = maxPart.current()
    while (startIndex > 0 && word == parts[startIndex - 1].current()) startIndex--
    while (endIndex < (parts.length - 1) && word == parts[endIndex + 1].current()) endIndex++

    if (startIndex == 0 && endIndex == parts.length - 1) {
      cb(word, "normal", parts[startIndex], parts[endIndex])
    } else if (startIndex == 0) {
      cb(word, "removed", parts[startIndex], parts[endIndex])
    } else if (endIndex == parts.length - 1) {
      cb(word, "added", parts[startIndex], parts[endIndex])
    } else {
      cb(word, "transient", parts[startIndex], parts[endIndex])
    }
    _.each(parts.slice(startIndex, endIndex + 1), function(part, i) { part.advance() })
  }
}
