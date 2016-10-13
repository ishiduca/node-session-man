'use strict'
module.exports = exports = function (/*location, config*/) {
    const levelup = require('levelup')
    const store   = levelup.apply(null, arguments)
    const ids     = {}

    return {
        get (key, f) {
            store.get(key, f)
        }
      , put (key, value, timeout, f) {
            store.put(key, value, f)
            if (timeout > 0) {
                ids[key] = setTimeout(() => {
                    this.remove(key, err => {
                        if (err) console.log(err)
                    })
                }, timeout * 1000)
            }
        }
      , remove (key, f) {
            store.del(key, err => {
                if (err) return f(err)
                clearTimeout(ids[key])
                delete ids[key]
                f()
            })
        }
    }
}
