/*global describe, it*/
var assert = require('component/assert')
var Board = require('../')
var shapes = require('../shapes')

describe('Board', function () {
  it('returns a new instance', function () {
    assert(Board() !== Board())
  })
})

describe('Board#json', function () {
  var board = Board()
  var json

  board.nextShape('T')
  json = board.json()

  it('returns board.grid', function () {
    assert(json.grid.length === 20)
  })
  it('returns board.currentShapeRotation', function () {
    assert(json.currentShapeRotation === 0)
  })
  it('returns board.currentShapeRotation', function () {
    assert(json.currentShapeRotation === 0)
  })
  it('returns board.currentX', function () {
    assert(json.currentX === 0)
  })
  it('returns board.currentY', function () {
    assert(json.currentY === 0)
  })
})

describe('Board#nextShape', function () {
  it('sets the currentShape to next shape in queue', function () {
    var board = Board()
    board.queue = ['T']
    board.nextShape()
    assert(board.currentShape.color === 'purple')
  })
  it('sets board.currentX to 0', function () {
    var board = Board()
    board.queue = ['T']
    board.currentX = 1
    board.nextShape()
    assert(board.currentX === 0)
  })
  it('sets board.currentY to 0', function () {
    var board = Board()
    board.queue = ['T']
    board.currentY = 1
    board.nextShape()
    assert(board.currentY === 0)
  })
  it('sets board.currentShapeRotation to 0', function () {
    var board = Board()
    board.queue = ['T']
    board.currentShapeRotation = 1
    board.nextShape()
    assert(board.currentShapeRotation === 0)
  })
})

describe('Board#freeze', function () {
  it('freezes a shape to the board', function () {
    var board = Board()
    board.queue = ['T']
    board.nextShape()
    board.timer = true
    board.tick()
    board.tick()
    board.tick()
    board.tick()
    board.freeze()
    board.stop()
    assert(board.grid[4][2] === board.currentShape.color)
    assert(board.grid[5][1] === board.currentShape.color)
    assert(board.grid[5][2] === board.currentShape.color)
    assert(board.grid[5][3] === board.currentShape.color)
  })
})

describe('Board#clearGrid', function () {
  it('clears the grid', function () {
    var board = Board()
    board.queue = ['T']
    board.nextShape()
    board.tick()
    board.tick()
    board.tick()
    board.tick()
    board.freeze()
    board.clearGrid()
    board.grid.forEach(function (row) {
      row.forEach(function (cell) {
        assert(cell === 0)
      })
    })
  })
})

describe('Board#sync', function () {
  it('syncs board data', function (done) {
    var board = Board()
    var newData = {
      queue: ['S', 'Z', 'T', 'I']
    }
    board.queue = ['T', 'Z', 'S']
    assert(board.queue.length === 3)
    board.on('sync', function () {
      assert(board.queue.length === 4)
      done()
    })
    board.sync(newData)

  })
})

// describe('Board#stop', function () {
//   it('stops the game loop', function () {
//     var board = Board()
//     board.queue = ['T', 'S', 'Z']
//     board.nextShape()
//     board.start()
//     board.stop()
//   })
// })

// test('Board#sync', function (t) {
//   t.plan(1)
//   var board = Board()
//   var data = {
//     currentShape: shapes[0]
//   }
//   board.sync(data)
//   t.equal(board.currentShape, shapes[0], 'syncs currentShape')
// })

// test('Board#stop', function (t) {
//   t.plan(1)
//   var board = Board()
//   board.newShape('T')
//   board.start()
//   board.stop()
//   t.equal(board.interval[0], null, 'clears interval')
// })

// test('Board#randomLine', function (t) {
//   t.plan(2)
//   var board = Board()
//   var row = board.randomLine()
//   var emptyCount = 2
//   t.equal(row.length, 10, 'returns row 10 cells wide')
//   row.forEach(function (cell) {
//     if (cell === 0) --emptyCount
//   })
//   t.equal(emptyCount, 0, 'three cells are empty')
// })

// test('Board#addLines', function (t) {
//   t.plan(3)
//   var board = Board()
//   board.addLines(3)
//   var lines = [board.grid[19], board.grid[18], board.grid[17]]
//   lines.forEach(function (line) {
//     line.some(function (cell) {
//       if (cell !== 0) {
//         t.true(true, 'line has colored cells')
//         return true
//       }
//     })
//   })
// })

// test('Board#moveDown', function (t) {})
// test('Board#moveRight', function (t) {})
// test('Board#moveLeft', function (t) {})
// test('Board#drop', function (t) {})
// test('Board#rotate', function (t) {})
// test('Board#validateMove', function (t) {})
// test('Board#tick', function (t) {})
// test('Board#start', function (t) {})
// test('Board#import', function (t) {})
