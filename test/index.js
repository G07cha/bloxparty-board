var test = require('tape')
var Board = require('../')
var shapes = require('../shapes')

test('Board', function (t) {
  t.plan(1)
  t.notEqual(Board(), Board(), 'returns a new instance')
})

test('Board#json', function (t) {
  t.plan(5)
  var board = Board()
  board.newShape('T')
  var json = board.json()
  t.equal(json.grid.length, 0, 'returns board.grid')
  t.equal(json.currentShapeRotation, 0, 'returns board.currentShapeRotation')
  t.equal(json.currentShape, shapes['T'], 'returns board.currentShape')
  t.equal(json.currentX, 0, 'returns board.currentX')
  t.equal(json.currentY, 0, 'returns board.currentY')
})

test('Board#newShape', function (t) {
  t.plan(3)
  var board = Board()
  board.newShape(shapes[0])
  t.equal(board.currentShape,  shapes[0], 'sets currentShape to given shape')
  t.equal(board.currentX, 0, 'sets currentX to 0')
  t.equal(board.currentY, 0, 'sets currentX to 0')
})

test('Board#sync', function (t) {
  t.plan(1)
  var board = Board()
  var data = {
    currentShape: shapes[0]
  }
  board.sync(data)
  t.equal(board.currentShape, shapes[0], 'syncs currentShape')
})

test('Board#stop', function (t) {
  t.plan(1)
  var board = Board()
  board.newShape('T')
  board.start()
  board.stop()
  t.equal(board.interval[0], null, 'clears interval')
})

test('Board#randomLine', function (t) {
  t.plan(2)
  var board = Board()
  var row = board.randomLine()
  var emptyCount = 3
  t.equal(row.length, 10, 'returns row 10 cells wide')
  row.forEach(function (cell) {
    if (cell === '') --emptyCount
  })
  t.equal(emptyCount, 0, 'three cells are empty')
})

// test('Board#moveDown', function (t) {})
// test('Board#moveRight', function (t) {})
// test('Board#moveLeft', function (t) {})
// test('Board#drop', function (t) {})
// test('Board#rotate', function (t) {})
// test('Board#validateMove', function (t) {})
// test('Board#tick', function (t) {})
// test('Board#start', function (t) {})
// test('Board#import', function (t) {})
