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

  board.newShape('T')
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

// test('Board#newShape', function (t) {
//   t.plan(3)
//   var board = Board()
//   board.newShape(shapes[0])
//   t.equal(board.currentShape,  shapes[0], 'sets currentShape to given shape')
//   t.equal(board.currentX, 0, 'sets currentX to 0')
//   t.equal(board.currentY, 0, 'sets currentX to 0')
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
