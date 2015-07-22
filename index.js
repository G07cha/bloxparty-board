try {
  var Emitter = require('component-emitter')
} catch (e) {
  var Emitter = require('component/emitter')
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
  this.currentX = 0
  this.currentY = 0
  this.lost = false
}

/**
 * Mixins
 */
Emitter(Board.prototype)

/**
 * Return a JSON representation of this board
 * @return {JSON} JSON Object
 */
Board.prototype.json = function json() {
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
Board.prototype.newShape = function newShape (shape) {
  this.currentShape = shape
  // position where the block will first appear on the board
  this.currentX = 0
  this.currentY = 0
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
}

/**
 * Clear this player's board
 * @api private
 */
Board.prototype.clear = function clear () {
  for (var y = 0; y < this.rows; ++y) {
    this.grid[y] = []
    for (var x = 0; x < this.columns; ++x) {
      this.grid[y][x] = 0
    }
  }
}

/**
 * Check if any lines are filled and clear them
 * @api private
 */
Board.prototype.clearLines = function clearLines () {
  var length = this.rows - 1
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
    }
  }
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

Board.prototype.moveDown = function moveDown () {
  if (this.validateMove(0, 1)) ++this.currentY
}

Board.prototype.moveRight = function moveRight () {
  if (this.validateMove(1)) ++this.currentX
}

Board.prototype.moveLeft = function moveLeft () {
  if (this.validateMove(-1)) --this.currentX
}

Board.prototype.drop = function drop () {
  while (this.validateMove(0, 1)) ++this.currentY
}

Board.prototype.rotate = function rotate () {
  var rotation = this.currentShapeRotation === 3 ? 0 : this.currentShapeRotation + 1
  if (this.validateMove(0, 0, rotation)) this.currentShapeRotation = rotation
}

/**
 * Checks if the resulting position of current shape will be feasible
 * @param  {Number} offsetX
 * @param  {Number} offsetY
 * @param  {Array} shape Supply a shape other than the current shape to validate
 * @return {Boolean}
 */
Board.prototype.validateMove = function validateMove (offsetX, offsetY, shape) {
  shape = shape || this.currentShape.shapes[this.currentShapeRotation]
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
          y + offsetY >= this.game.rows ||
          x + offsetX >= this.game.columns) {
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
    if (this.currentY === 0) this.lost = true // lost if the current shape is at the top row when checked
    if (this.lost) {
      this.emit('lost')
      this.stop()
    }
    this.createShape()
  }
}

/**
 * Start this player's board
 * @api public
 */
Board.prototype.start = function start () {
  if (this.interval) clearInterval(this.interval)
  var self = this
  this.lost = false
  this.clear()
  this.createShape()
  this.interval = setInterval(function () {
    self.tick()
  }, this.fallRate)
  this.emit('start')
}

/**
 * Freeze this player's board in place
 * @api public
 */
Board.prototype.stop = function stop () {
  this.freeze()
  clearInterval(this.interval)
}
