var collect = require('collect-stream')
var xtend = require('xtend')
var mapStream = require('through2-map')

var errors = require('../errors')
var refs2nodes = require('../lib/util').refs2nodes

module.exports = function (osm) {
  return function getElement (id, opts, cb) {
    if (typeof opts === 'function') {
      cb = opts
      opts = null
    }
    opts = opts || {}
    if (opts.history) {
      getHistory(id, cb)
    } else if (opts.version) {
      getVersion(id, opts.version, cb)
    } else {
      getForks(id, cb)
    }
  }

  function getForks (id, cb) {
    osm.get(id, function (err, docs) {
      if (err) return cb(err)
      var forks = Object.keys(docs)
      if (forks.length === 0) return cb(new errors.NotFound('element id: ' + id))
      forks = forks.map(function (key) {
        return xtend(docs[key], {
          id: id,
          version: key
        })
      }).map(refs2nodes)
      cb(null, forks)
    })
  }

  function getVersion (id, version, cb) {
    osm.log.get(version, function (err, doc) {
      if (err && (/^notfound/.test(err) || err.notFound)) {
        err = errors(404, err)
      }
      if (err) return cb(err)
      var element = xtend(doc.value.v, {
        id: id,
        version: version
      })
      cb(null, refs2nodes(element))
    })
  }

  function getHistory (id, cb) {
    var r = osm.kv.createHistoryStream(id).on('error', function (err) {
      if (/^notfound/i.test(err) || err.notFound) {
        err = new errors.NotFound('element id: ' + id)
      }
      if (cb) return cb(err)
      if (stream) return stream.emit('error', err)
    })
    if (cb) {
      collect(r, function (err, rows) {
        if (err) return cb(err)
        cb(null, rows.map(rowMap))
      })
    } else {
      var stream = r.pipe(mapStream.obj(rowMap))
      return stream
    }
  }
}

function rowMap (row) {
  return xtend(refs2nodes(row.value), {
    id: row.key,
    version: row.link
  })
}
