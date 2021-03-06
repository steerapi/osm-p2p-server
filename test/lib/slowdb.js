var memdb = require('memdb')
var EventEmitter = require('events').EventEmitter

function slowdb (opts) {
  opts = opts || {}
  var delay = opts.delay || 100
  var db = memdb()
  var slowdb = new EventEmitter()
  slowdb.setMaxListeners(Infinity)
  slowdb.db = {}
  slowdb.db.get = function (key, opts, cb) {
    setTimeout(function () {
      db.db.get(key, opts, cb)
    }, Math.random() * delay)
  }
  slowdb.db.put = function (key, value, opts, cb) {
    setTimeout(function () {
      db.db.put(key, value, opts, cb)
    }, Math.random() * delay)
  }
  slowdb.db.del = db.db.del.bind(db.db)
  slowdb.db.batch = db.db.batch.bind(db.db)
  slowdb.db.iterator = db.db.iterator.bind(db.db)
  slowdb.get = db.get.bind(db)
  slowdb.put = db.put.bind(db)
  slowdb.del = db.del.bind(db)
  slowdb.batch = db.batch.bind(db)
  slowdb.createReadStream = db.createReadStream.bind(db)
  slowdb.isOpen = db.isOpen.bind(db)
  db.on('open', slowdb.emit.bind(slowdb, 'open'))
  return slowdb
}

module.exports = slowdb
