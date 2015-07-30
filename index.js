var Emitter
var clone
var shapes = require('./shapes')

try {
  Emitter = require('component-emitter')
  clone = require('component-clone')
} catch (e) {
  Emitter = require('component/emitter')
  clone = require('component/clone')
}

/**
 * Export `Board`
 */
module.exports = Board

/**
 * Initalize `Board` with `attrs`
 * @param {Object} attrs
 * @api private
 */
function Board (attrs) {
  if (!(this instanceof Board)) return new Board(attrs)
  attrs = attrs || {}
  this.rows = attrs.rows || 20
  this.columns = attrs.columns || 10
  this.grid = attrs.grid || []
  this.fallRate = attrs.fallRate || 750
  this.currentShapeRotation = 0
  this.currentShape = null
  this.interval = null
  this.currentX = 0
  this.currentY = 0
  this.lost = false
  this.clearBoard()
}

/**
 * Mixins
 */
Emitter(Board.prototype)

/**
 * Return a JSON representation of this board
 * @return {JSON} JSON Object
 */
Board.prototype.json = function json () {
  var json = {
    grid: this.grid,
    currentShapeRotation: this.currentShapeRotation,
    currentShape: this.currentShape,
    currentX: this.currentX,
    currentY: this.currentY
  }

  return json
}

/**
 * Add the `shape` to this player's board
 * @api private
 */
Board.prototype.newShape = function newShape (name) {
  this.currentShape = shapes[name]
  this.currentShapeRotation = 0
  // position where the block will first appear on the board
  this.currentX = 0
  this.currentY = 0
  this.emit('change')
}

/**
 * Stop shape at its position and fix it to board
 * @api private
 */
Board.prototype.freeze = function freeze () {
  for (var y = 0; y < 4; ++y) {
    for (var x = 0; x < 4; ++x) {
      if (this.currentShape.rotations[this.currentShapeRotation][y][x]) {
        this.grid[y + this.currentY ][x + this.currentX ] = this.currentShape.color
      }
    }
  }
  this.emit('change')
}

/**
 * Clear this player's board
 * @api private
 */
Board.prototype.clearBoard = function clearBoard () {
  for (var y = 0; y < this.rows; ++y) {
    this.grid[y] = []
    for (var x = 0; x < this.columns; ++x) {
      this.grid[y][x] = 0
    }
  }
  this.emit('change')
}

/**
 * Check if any lines are filled and clear them
 * @api private
 */
Board.prototype.clearLines = function clearLines () {
  var length = this.rows - 1
  var lineCount = 0
  var x = 0
  var y = 0
  for (y = length; y >= 0; --y) {
    var rowFilled = true
    for (x = 0; x < this.columns; ++x) {
      if (this.grid[y][x] === 0) {
        rowFilled = false
        break
      }
    }
    if (rowFilled) {
      for (var yy = y; yy > 0; --yy) {
        for (x = 0; x < this.columns; ++x) {
          this.grid[yy][x] = this.grid[yy - 1 ][x]
        }
      }
      ++y
      ++lineCount
    }
  }

  if (lineCount > 0) this.emit('clear lines', lineCount)
  this.emit('change')
}

/**
 * Attempt to move piece in `direction`
 * @api private
 */
Board.prototype.move = function move (direction) {
  switch (direction) {
    case 'left':
      this.moveLeft()
      break
    case 'right':
      this.moveRight()
      break
    case 'down':
      this.moveDown()
      break
    case 'drop':
      this.drop()
      break
    case 'rotate':
      this.rotate()
      break
  }
}

/**
 * Move the current piece down
 * @api private
 */
Board.prototype.moveDown = function moveDown () {
  if (this.validateMove(0, 1)) {
    ++this.currentY
    this.emit('change')
  }
}

/**
 * Move the current piece right
 * @api private
 */
Board.prototype.moveRight = function moveRight () {
  if (this.validateMove(1)) {
    ++this.currentX
    this.emit('change')
  }
}

/**
 * Move the current piece left
 * @api private
 */
Board.prototype.moveLeft = function moveLeft () {
  if (this.validateMove(-1)) {
    --this.currentX
    this.emit('change')
  }
}

Board.prototype.addLines = function addLines (count) {
  var newGrid = clone(this.grid)
  var x = 0
  while (count > 0) {
    var first = newGrid.shift()
    for (x = 0; x < this.columns; ++x) {
      if (first[x] !== 0) {
        this.lose()
        break
      }
    }
    newGrid.push(this.randomLine())
    count--
  }
  this.grid = newGrid
  this.emit('change')
}

Board.prototype.randomLine = function randomLine () {
  var colors = Object.keys(shapes).map(function (shape) {
    return shapes[shape].color
  })
  var length = this.columns
  var line = []
  var missingBlocks = 3

  while (length > 0) {
    var color = colors[Math.floor(Math.random() * colors.length)]
    line.push(color)
    --length
  }

  while (missingBlocks > 0) {
    var cellIndex = Math.floor(Math.random() * line.length)
    if (line[cellIndex]) {
      line[cellIndex] = 0
      --missingBlocks
    }
  }
  return line
}

/**
 * Move the current piece down until it settles
 * @api private
 */
Board.prototype.drop = function drop () {
  while (this.validateMove(0, 1)) {
    ++this.currentY
  }
  this.emit('change')
}

/**
 * Rotate the current piece
 * @api private
 */
Board.prototype.rotate = function rotate () {
  var rotation = this.currentShapeRotation === 3 ? 0 : this.currentShapeRotation + 1
  var shape = this.currentShape.rotations[rotation]
  if (!this.validateMove(0, 0, shape)) return
  this.currentShapeRotation = rotation
  this.emit('change')
}

/**
 * Checks if the resulting position of current shape will be feasible
 * @param  {Number} offsetX
 * @param  {Number} offsetY
 * @param  {Array} shape Supply a shape other than the current shape to validate
 * @return {Boolean}
 */
Board.prototype.validateMove = function validateMove (offsetX, offsetY, shape) {
  shape = shape || this.currentShape.rotations[this.currentShapeRotation]
  offsetX = offsetX || 0
  offsetY = offsetY || 0
  offsetX = this.currentX + offsetX
  offsetY = this.currentY + offsetY

  for (var y = 0; y < 4; ++y) {
    for (var x = 0; x < 4; ++x) {
      if (shape[y][x]) {
        if (typeof this.grid[y + offsetY ] === 'undefined' ||
          typeof this.grid[y + offsetY ][x + offsetX ] === 'undefined' ||
          this.grid[y + offsetY ][x + offsetX ] ||
          x + offsetX < 0 ||
          y + offsetY >= this.rows ||
          x + offsetX >= this.columns) {
          return false
        }
      }
    }
  }
  return true
}

/**
 * Game loop
 * @api private
 */
Board.prototype.tick = function tick () {
  if (this.validateMove(0, 1)) {
    ++this.currentY
  } else {
    // if the element settled
    this.freeze()
    this.clearLines()
    if (this.currentY === 0) this.lose()
    this.emit('settled')
  }
  this.emit('tick')
}

Board.prototype.lose = function lost () {
  this.lost = true
  this.emit('lost')
}

/**
 * Start this board
 * @api public
 */
Board.prototype.start = function start () {
  var self = this
  if (!this.currentShape) this.error('Missing current shape')
  if (this.interval) clearInterval(this.interval)
  this.interval = setInterval(function () {
    self.tick()
  }, this.fallRate)
  this.emit('change')
  this.emit('start')
}

/**
 * Stop this board
 * @api public
 */
Board.prototype.stop = function stop () {
  clearInterval(this.interval)
}

/**
 * Emit error with `msg`
 * @param  {String} msg
 * @api private
 */
Board.prototype.error = function error (msg) {
  this.emit('error', new Error(msg))
}

/**
 * Reset the board
 * @api public
 */
Board.prototype.reset = function reset () {
  this.lost = false
  this.clearBoard()
  this.emit('change')
  this.emit('reset')
}

/**
 * Import board data.  For syncing with external sources.
 * @param  {Object} data
 * @api public
 */
Board.prototype.sync = function sync (data) {
  var self = this
  Object.keys(data).forEach(function (key) {
    self[key] = data[key]
  })
}
