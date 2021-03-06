/*global requestAnimationFrame*/
var uid = require('uid')
var shapes = require('./shapes')
var Emitter = require('component-emitter')
var clone = require('component-clone')
var diff = require('deep-diff')
var c = require('color')

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
  this.id = uid()
  this.movementEl = attrs.movementEl || null
  this.backgroundEl = attrs.backgroundEl || null
  this.previewEl = attrs.previewEl || null
  this.movementCTX = null
  this.backgroundCTX = null
  this.previewCTX = null
  this.rows = attrs.rows || 22
  this.columns = attrs.columns || 10
  this.grid = attrs.grid || []
  this.currentShapeRotation = 0
  this.currentShape = null
  this.queue = []
  this.currentX = 3
  this.currentY = 0
  this.lost = false
  this.active = false
  this.quit = false
  this.timeout = null
  this.lineCount = 0
  this.level = 0
  this.diffProps = [
    'grid',
    'level',
    'currentShape',
    'currentShapeRotation',
    'currentX',
    'currentY'
  ]
  if (this.backgroundEl) this.getElStats(attrs)
  if (this.previewEl) this.getPreviewElStats(attrs)
  this.clearGrid()
}

/**
 * Mixins
 */
Emitter(Board.prototype)

/**
 * Start this board
 * @api public
 */
Board.prototype.start = function start () {
  this.tick()
  this.set('active', true)
  this.emit('change')
  this.emit('start')
}

/**
 * Stop this board
 * @api public
 */
Board.prototype.stop = function stop () {
  clearTimeout(this.timeout)
  this.set('endLoop', true)
  this.set('timeout', null)
  this.set('active', false)
  this.emit('change')
}

/**
 * Set `prop` value to `value`
 * @param {String} prop Property name
 * @param {Mixed} value Property value
 */
Board.prototype.set = function set (prop, value) {
  this[prop] = clone(value)
  this.emit('change ' + prop, value)
  this.emit('change')
}

/**
 * Grab next shape from queue
 * @api private
 */
Board.prototype.nextShape = function nextShape () {
  this.set('currentShapeRotation', 0)
  this.set('currentX', 3)
  this.set('currentY', 0)
  this.set('currentShape', shapes[this.queue.shift()])
  this.emit('new shape')
  this.emit('change')
}

/**
 * Attempt to move piece in `direction`
 * @api private
 */
Board.prototype.move = function move (direction) {
  return this[direction]()
}

/**
 * Game loop
 * @api private
 */
Board.prototype.tick = function tick () {
  var self = this
  var valid = null

  if (!this.currentShape) {
    this.nextShape()
    valid = true
  } else {
    valid = this.move('down')
  }

  if (!valid) {
    if (this.currentY === 0) return this.lose()
    this.freeze()
    this.clearLines()
    this.nextShape()
  }

  this.setFallRate()
  this.emit('change')
  this.timeout = setTimeout(function () {
    self.tick()
  }, this.fallRate)
}

/**
 * Set the fall rate of current shape
 * @api private
 */
Board.prototype.setFallRate = function setFallRate () {
  this.set('fallRate', ((11 - this.level) * 50))
}

/**
 * Return a JSON representation of this board
 * @return {JSON} JSON Object
 * @api public
 */
Board.prototype.json = function json () {
  var json = {
    queue: this.queue,
    grid: this.grid,
    currentShapeRotation: this.currentShapeRotation,
    currentShape: this.currentShape,
    currentX: this.currentX,
    currentY: this.currentY,
    level: this.level,
    active: this.active
  }

  return json
}

/**
 * Get 2d Contexts and sizes of canvas elements
 * @api public
 */
Board.prototype.getElStats = function getElStats () {
  this.backgroundCTX = this.backgroundEl.getContext('2d')
  this.movementCTX = this.movementEl.getContext('2d')

  var translate = (this.backgroundCTX.lineWidth % 2) / 2

  this.backgroundCTX.setTransform(1, 0, 0, 1, 0, 0)
  this.backgroundCTX.translate(translate, translate)
  this.backgroundCTX.save()

  this.movementCTX.setTransform(1, 0, 0, 1, 0, 0)
  this.movementCTX.translate(translate, translate)
  this.movementCTX.save()

  this.elWidth = this.backgroundEl.offsetWidth
  this.elHeight = this.backgroundEl.offsetHeight
  this.cellWidth = this.elWidth / this.columns
  this.cellHeight = this.elHeight / (this.rows - 2)
}

/**
 * Get 2d context and size
 * @return {[type]} [description]
 */
Board.prototype.getPreviewElStats = function getPreviewElStats () {
  if (!this.previewEl) return
  this.previewCTX = this.previewEl.getContext('2d')
  var translate = (this.previewCTX.lineWidth % 2) / 2
  this.previewCTX.setTransform(1, 0, 0, 1, 0, 0)
  this.previewCTX.translate(translate, translate)
  this.previewCTX.save()

  this.elWidth = this.previewEl.offsetWidth
  this.elHeight = this.previewEl.offsetHeight
  this.cellWidth = this.elWidth / 4
  this.cellHeight = this.elHeight / 4
}

/**
 * Stop shape at its position and fix it to board
 * @api private
 */
Board.prototype.freeze = function freeze () {
  for (var y = 0; y < 4; ++y) {
    for (var x = 0; x < 4; ++x) {
      if (this.currentShape.rotations[this.currentShapeRotation][y][x]) {
        this.grid[ y + this.currentY ][ x + this.currentX ] = this.currentShape.color
      }
    }
  }
  this.emit('grid')
  this.emit('change')
}

/**
 * Clear this player's board
 * @api private
 */
Board.prototype.clearGrid = function clearGrid () {
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
          this.grid[yy][x] = this.grid[yy - 1][x]
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
  this.emit('grid')
  this.emit('change')
}

/**
 * Move the current piece down
 * @api private
 */
Board.prototype.down = function down () {
  if (!this.validateMove(0, 1)) return false
  ++this.currentY
  this.emit('change')
  return true
}

/**
 * Move the current piece right
 * @api private
 */
Board.prototype.right = function right () {
  if (!this.validateMove(1)) return false
  ++this.currentX
  this.emit('change')
  return true
}

/**
 * Move the current piece left
 * @api private
 */
Board.prototype.left = function left () {
  if (!this.validateMove(-1)) return false
  --this.currentX
  this.emit('change')
  return true
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
  if (!this.validateMove(0, 0, shape)) return false
  this.set('currentShapeRotation', rotation)
  this.emit('change')
  return true
}

/**
 * Render loop
 * @api public
 */
Board.prototype.render = function render () {
  this.endLoop = false
  var self = this
  var now
  var fps = 30
  var then = Date.now()
  var interval = 1000 / fps
  var deltaTime

  function loop (timestamp) {
    if (self.endLoop) return
    requestAnimationFrame(loop)
    now = Date.now()
    deltaTime = now - then

    if (deltaTime > interval) {
      self.drawGrid()
      self.drawCurrentShape()
      then = now - (deltaTime % interval)
    }
  }

  loop()
}

/**
 * Add `count` garbage lines to this board
 * @param {Number} count Number of lines to add
 * @api public
 */
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
  this.set('grid', newGrid)
  this.emit('grid')
  this.emit('change')
}

/**
 * Generate a random garbage line
 * @return {Array} 2d Array
 * @api public
 */
Board.prototype.randomLine = function randomLine () {
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
        if (typeof this.grid[y + offsetY] === 'undefined' ||
          typeof this.grid[y + offsetY][x + offsetX] === 'undefined' ||
          this.grid[y + offsetY][x + offsetX] ||
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
 * Mark this board as `lost`
 * @api public
 */
Board.prototype.lose = function lose () {
  this.set('lost', true)
  this.stop()
  this.emit('lose')
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
  clearTimeout(this.timeout)
  this.set('endLoop', true)
  this.set('level', 0)
  this.set('currentY', 0)
  this.set('currentX', 3)
  this.set('currentShape', null)
  this.set('currentShapeRotation', null)
  this.set('lineCount', 0)
  this.set('lost', false)
  this.clearGrid()
  this.emit('grid')
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
  diff.observableDiff(this.json(), data, function (d) {
    if (self.diffProps.indexOf(d.path[0]) !== -1) {
      diff.applyChange(self, data, d)
    }
  })
  this.emit('sync')
}

/**
 * Render the grid to a canvas element
 * @api public
 */
Board.prototype.drawGrid = function drawGrid () {
  var ctx = this.backgroundCTX
  var cellWidth = this.cellWidth
  var cellHeight = this.cellHeight
  ctx.imageSmoothingEnabled = false
  var y = 0
  var x = 0
  var blocks = {
    red: [],
    green: [],
    purple: [],
    cyan: [],
    blue: [],
    orange: [],
    yellow: []
  }
  ctx.clearRect(0, 0, this.elWidth, this.elHeight)
  // renderGrid()
  for (x = 0; x < 10; ++x) {
    for (y = 0; y < 22; ++y) {
      if (this.grid[y][x]) {
        blocks[this.grid[y][x]].push([x, y])
      }
    }
  }

  for (var color in blocks) {
    blocks[color].forEach(function (cell) {
      var x = cellWidth * cell[0]
      var y = (cellHeight * cell[1]) - (cellHeight * 2)
      var bevelWidth = cellWidth * 0.1

      var innerX = x + (cellWidth * 0.1)
      var innerY = y + (cellHeight * 0.1)
      var innerWidth = cellWidth - (cellWidth * 0.1) * 2
      var innerHeight = cellWidth - (cellHeight * 0.1) * 2

      var topLeftColor = c(color).lighten(0.6).rgbString()
      var bottomRightColor = c(color).darken(0.5).rgbString()

      ctx.fillStyle = color
      ctx.fillRect(innerX, innerY, innerWidth, innerHeight)

      ctx.fillStyle = topLeftColor
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + cellWidth, y)
      ctx.lineTo(x + cellWidth - bevelWidth, y + bevelWidth)
      ctx.lineTo(x + bevelWidth, y + bevelWidth)
      ctx.lineTo(x + bevelWidth, y + cellHeight - bevelWidth)
      ctx.lineTo(x, y + cellHeight)
      ctx.closePath()
      ctx.fill()

      ctx.fillStyle = bottomRightColor
      ctx.beginPath()
      ctx.moveTo(x + cellWidth, y)
      ctx.lineTo(x + cellWidth, y + cellHeight)
      ctx.lineTo(x, y + cellHeight)
      ctx.lineTo(x + bevelWidth, y + cellHeight - bevelWidth)
      ctx.lineTo(x + cellWidth - bevelWidth, y + cellHeight - bevelWidth)
      ctx.lineTo(x + cellWidth - bevelWidth, y + bevelWidth)
      ctx.closePath()
      ctx.fill()
    })
  }
}

/**
 * Draw the currently falling shape to a canvas element
 * @api public
 */
Board.prototype.drawCurrentShape = function drawCurrentShape () {
  if (!this.currentShape) return
  var ctx = this.movementCTX
  var cellWidth = this.cellWidth
  var cellHeight = this.cellHeight
  var y = 0
  var x = 0
  ctx.clearRect(0, -1, this.elWidth, this.elHeight + 1)
  var color = this.currentShape.color
  for (y = 0; y < 4; ++y) {
    for (x = 0; x < 4; ++x) {
      if (this.currentShape.rotations[this.currentShapeRotation][y][x]) {
        ctx.fillStyle = color

        var cellX = cellWidth * (this.currentX + x)
        var cellY = (cellHeight * (this.currentY + y)) - (this.cellHeight * 2)
        var bevelWidth = cellWidth * 0.1
        var innerX = cellX + (cellWidth * 0.1)
        var innerY = cellY + (cellHeight * 0.1)
        var innerWidth = cellWidth - (cellWidth * 0.1) * 2
        var innerHeight = cellWidth - (cellHeight * 0.1) * 2
        var topLeftColor = c(color).lighten(0.6).rgbString()
        var bottomRightColor = c(color).darken(0.5).rgbString()

        ctx.fillStyle = color
        ctx.fillRect(innerX, innerY, innerWidth, innerHeight)

        ctx.fillStyle = topLeftColor
        ctx.beginPath()
        ctx.moveTo(cellX, cellY)
        ctx.lineTo(cellX + cellWidth, cellY)
        ctx.lineTo(cellX + cellWidth - bevelWidth, cellY + bevelWidth)
        ctx.lineTo(cellX + bevelWidth, cellY + bevelWidth)
        ctx.lineTo(cellX + bevelWidth, cellY + cellHeight - bevelWidth)
        ctx.lineTo(cellX, cellY + cellHeight)
        ctx.closePath()
        ctx.fill()

        ctx.fillStyle = bottomRightColor
        ctx.beginPath()
        ctx.moveTo(cellX + cellWidth, cellY)
        ctx.lineTo(cellX + cellWidth, cellY + cellHeight)
        ctx.lineTo(cellX, cellY + cellHeight)
        ctx.lineTo(cellX + bevelWidth, cellY + cellHeight - bevelWidth)
        ctx.lineTo(cellX + cellWidth - bevelWidth, cellY + cellHeight - bevelWidth)
        ctx.lineTo(cellX + cellWidth - bevelWidth, cellY + bevelWidth)
        ctx.closePath()
        ctx.fill()
      }
    }
  }
}

/**
 * Render the next piece in the queue to a canvas element
 * @api public
 */
Board.prototype.drawPreview = function drawPreview () {
  if (!this.previewEl) return
  var ctx = this.previewCTX
  ctx.imageSmoothingEnabled = false
  var y = 0
  var x = 0
  ctx.clearRect(-1, -1, this.previewEl.offsetWidth, this.previewEl.offsetHeight)
  if (!this.queue || !this.queue[0]) return
  var shape = this.queue[0]
  var color = shapes[shape].color
  for (y = 0; y < 4; ++y) {
    for (x = 0; x < 4; ++x) {
      if (shapes[shape].rotations[0][y][x]) {
        var cellWidth = this.cellWidth
        var cellHeight = this.cellHeight
        var cellX = cellWidth * x
        var cellY = cellHeight * y
        var bevelWidth = cellWidth * 0.1
        var innerX = cellX + (cellWidth * 0.1)
        var innerY = cellY + (cellHeight * 0.1)
        var innerWidth = cellWidth - (cellWidth * 0.1) * 2
        var innerHeight = cellWidth - (cellHeight * 0.1) * 2
        var topLeftColor = c(color).lighten(0.6).rgbString()
        var bottomRightColor = c(color).darken(0.5).rgbString()

        ctx.fillStyle = color
        ctx.fillRect(innerX, innerY, innerWidth, innerHeight)

        ctx.fillStyle = topLeftColor
        ctx.beginPath()
        ctx.moveTo(cellX, cellY)
        ctx.lineTo(cellX + cellWidth, cellY)
        ctx.lineTo(cellX + cellWidth - bevelWidth, cellY + bevelWidth)
        ctx.lineTo(cellX + bevelWidth, cellY + bevelWidth)
        ctx.lineTo(cellX + bevelWidth, cellY + cellHeight - bevelWidth)
        ctx.lineTo(cellX, cellY + cellHeight)
        ctx.closePath()
        ctx.fill()

        ctx.fillStyle = bottomRightColor
        ctx.beginPath()
        ctx.moveTo(cellX + cellWidth, cellY)
        ctx.lineTo(cellX + cellWidth, cellY + cellHeight)
        ctx.lineTo(cellX, cellY + cellHeight)
        ctx.lineTo(cellX + bevelWidth, cellY + cellHeight - bevelWidth)
        ctx.lineTo(cellX + cellWidth - bevelWidth, cellY + cellHeight - bevelWidth)
        ctx.lineTo(cellX + cellWidth - bevelWidth, cellY + bevelWidth)
        ctx.closePath()
        ctx.fill()
      }
    }
  }
}

/**
 * Draw `text` on the canvas
 * @param  {String} text Text to draw
 * @api public
 */
Board.prototype.drawText = function drawText (text) {
  if (!this.backgroundEl) return
  var ctx = this.backgroundCTX
  var x = this.backgroundEl.width / 2
  var y = this.backgroundEl.height / 2
  ctx.fillStyle = 'white'
  ctx.textAlign = 'center'
  ctx.font = '16pt Play'
  ctx.shadowBlur = 6
  ctx.shadowColor = 'rgb(0, 255, 255)'
  wrapText(ctx, text, x, y, 200, 25)
  ctx.shadowBlur = 0
}

function wrapText (context, text, x, y, maxWidth, lineHeight) {
  var words = text.split(' ')
  var line = ''

  for (var n = 0; n < words.length; n++) {
    var testLine = line + words[n] + ' '
    var metrics = context.measureText(testLine)
    var testWidth = metrics.width
    if (testWidth > maxWidth && n > 0) {
      context.fillText(line, x, y)
      line = words[n] + ' '
      y += lineHeight
    } else {
      line = testLine
    }
  }
  context.fillText(line, x, y)
}
