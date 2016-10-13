'use strict'
module.exports = (db, schema) => {
    const uuid    = require('uuid')
    const xtend   = require('xtend')
    const through = require('through2')

    return {
        create (params, done) {
            try {
                schema(params)
            } catch (err) {
                return done(err)
            }

            var s = db.createValueStream().once('error', err => done(err))

            s.pipe(through.obj((user, _, cb) => {
                if (user.screen_name !== params.screen_name) return cb()

                var mes  = `screen_name "${params.screen_name}" is already in use`
                var err  = new Error(mes)
                err.name = 'ScreenNameError'
                err.data = params
                cb(err)
            }, cb => {
                save(params)
                cb()
            })).once('error', done)

            function save (_params) {
                const id = uuid.v4().split('-').join('')
                db.put(id, xtend(_params, {id: id}), err => {
                    err ? done(err) : done(null, id)
                })
            }
        }
      , get (params, done) {
            try {
                schema(params)
            } catch (err) {
                return done(err)
            }

            var ended = false
            var s = db.createValueStream().once('error', done)
            s.pipe(through.obj((user, _, cb) => {
                if (user.screen_name === params.screen_name) {
                    if (user.password !== params.password) {
                        var err = new Error(`wrong password "${params.password}"`)
                        err.name = 'PasswordError'
                        err.data = params
                        return cb(err)
                    }
                    else {
                        ended = true
                        cb()
                        done(null, user)
                        return s.destroy()
                    }
                }
                cb()
            }, cb => {
                if (! ended) {
                    var err = new Error(`screen_name "${params.screen_name}" not found`)
                    err.name = 'ScreenNameNotFoundError'
                    err.data = params
                }
                cb(err)
            })).once('error', done)
        }
      , getById (id, done) {
            db.get(id, done)
        }
    }
}
