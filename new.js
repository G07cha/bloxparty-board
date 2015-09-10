var uid = require('uid')
var shapes = require('./shapes')
var Emitter
var clone

try {
  Emitter = require('component-emitter')
  clone = require('component-clone')
} catch (e) {
  Emitter = require('emitter')
  clone = require('clone')
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
  attrs = attrs || {}

  var board = {}
  var timeout= null

  Emitter(board)

  board.id = uid()
  board.ctx = attrs.ctx || null
  board.rows = attrs.rows || 20
  board.columns = attrs.columns || 10
  board.grid = attrs.grid || []
  board.fallRate = attrs.fallRate || 600
  board.currentShapeRotation = 0
  board.currentShape = null
  board.queue = []
  board.currentX = 0
  board.currentY = 0
  board.lost = false
  board.timeout = null
  board.lineCount = 0
  board.level = 0

  board.json = json
  board.nextShape = nextShape
  board.freeze = freeze
  board.clearGrid = clearGrid
  board.clearLines = clearLines
  board.move = move
  board.moveDown = moveDown
  board.moveLeft = moveLeft
  board.moveRight = moveRight
  board.drop = drop
  board.rotate = rotate
  board.tick = tick
  board.start = start
  board.stop = stop
  board.error = error
  board.reset = reset
  board.sync = sync
  board.validateMove = validateMove

  board.clearGrid()

  return board

  /**
   * Return a JSON representation of board board
   * @return {JSON} JSON Object
   */
  function json () {
    return {
      queue: this.queue,
      grid: this.grid,
      currentShapeRotation: this.currentShapeRotation,
      currentShape: this.currentShape,
      currentX: this.currentX,
      currentY: this.currentY,
      level: this.level
    }
  }

  /**
   * Add the `shape` to board player's board
   * @api private
   */
  function nextShape () {
    this.currentShape = shapes[this.queue[0]]
    this.queue.shift()
    this.currentShapeRotation = 0
    // position where the block will first appear on the this
    this.currentX = 0
    this.currentY = 0
    this.emit('new shape')
  }

  /**
   * Stop shape at its position and fix it to board
   * @api private
   */
  function freeze () {
    for (var y = 0; y < 4; ++y) {
      for (var x = 0; x < 4; ++x) {
        if (this.currentShape.rotations[this.currentShapeRotation][y][x]) {
          this.grid[y + this.currentY ][x + this.currentX ] = this.currentShape.color
        }
      }
    }
  }

  /**
   * Clear grid
   * @api private
   */
  function clearGrid () {
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
  function clearLines () {
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

    if (lineCount > 0) {
      this.emit('clear lines', lineCount)
      this.lineCount = this.lineCount + lineCount
    }

    if (this.lineCount <= 0) this.level = 1
    if ((this.lineCount >= 1) && (this.lineCount <= 90)) this.level = Math.floor(1 + ((this.lineCount - 1) / 5))
    if (this.lineCount >= 91) this.level = 10
  }

  /**
   * Attempt to move piece in `direction`
   * @api private
   */
  function move (direction) {
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
  function moveDown () {
    if (this.validateMove(0, 1)) {
      ++this.currentY
    }
  }

  /**
   * Move the current piece right
   * @api private
   */
  function moveRight () {
    if (this.validateMove(1)) {
      ++this.currentX
    }
  }

  /**
   * Move the current piece left
   * @api private
   */
  function moveLeft () {
    if (this.validateMove(-1)) {
      --this.currentX
    }
  }

  /**
   * Move the current piece down until it settles
   * @api private
   */
  function drop () {
    while (this.validateMove(0, 1)) {
      ++this.currentY
    }
  }

  /**
   * Rotate the current piece
   * @api private
   */
  function rotate () {
    var rotation = this.currentShapeRotation === 3 ? 0 : this.currentShapeRotation + 1
    var shape = this.currentShape.rotations[rotation]
    if (!this.validateMove(0, 0, shape)) return
    this.currentShapeRotation = rotation
  }

  /**
   * Checks if the resulting position of current shape will be feasible
   * @param  {Number} offsetX
   * @param  {Number} offsetY
   * @param  {Array} shape Supply a shape other than the current shape to validate
   * @return {Boolean}
   */
  function validateMove (offsetX, offsetY, shape) {
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

  function addLines (count) {
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
  }

  function randomLine () {
    var colors = Object.keys(shapes).map(function (shape) {
      return shapes[shape].color
    })
    var length = this.columns
    var line = []
    var missingBlocks = 2

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
   * Game loop
   * @api private
   */
  function tick () {
    var self = this
    if (board.validateMove(0, 1)) {
      ++this.currentY
    } else {
      // if the element settled
      this.freeze()
      this.clearLines()
      if (this.currentY === 0) return this.lose()
      this.nextShape()
    }
    this.fallRate = ((11 - this.level) * 50)
    timeout = setTimeout(function () {
      board.tick()
    }, this.fallRate)
  }

  function lose () {
    board.lost = true
    board.stop()
    board.emit('lost')
  }

  /**
   * Start board board
   * @api public
   */
  function start () {
    this.nextShape()
    if (!this.currentShape) return this.error('Missing current shape')
    tick()
    this.emit('start')
  }

  /**
   * Stop loop
   * @api public
   */
  function stop () {
    clearTimeout(timeout)
    timeout = null
  }

  /**
   * Emit error with `msg`
   * @param  {String} msg
   * @api private
   */
  function error (msg) {
    this.emit('error', new Error(msg))
  }

  /**
   * Reset the board
   * @api public
   */
  function reset () {
    this.lost = false
    this.clearGrid()
  }

  /**
   * Import board data.  For syncing with external sources.
   * @param  {Object} data
   * @api public
   */
  function sync (data) {
    var self = this
    Object.keys(data).forEach(function (key) {
      self[key] = data[key]
    })
  }

}