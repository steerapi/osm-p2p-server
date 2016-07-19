var collect = require('collect-stream')
var xtend = require('xtend')

var renderElem = require('../lib/render_elem.js')
var h = require('../lib/h.js')

module.exports = function () {
  return function (req, res, osm, m, next) {
    res.setHeader('content-type', 'text/xml')
    var rh = osm.kv.createHistoryStream(m.params.id)
    collect(rh, function (err, rows) {
      if (err) return next(err)
      res.end(h('osm', rows.map(function (row) {
        return renderElem(xtend(row.value, {
          id: row.key,
          version: row.link
        }))
      })))
    })
  }
}
