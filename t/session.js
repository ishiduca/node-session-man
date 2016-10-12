'use strict'
const http       = require('http')
const url        = require('url')
const hyperquest = require('hyperquest')
const test       = require('tape')
const SessionMan = require('../index')
const store      = {
    get (key, f) {
        process.nextTick(() => {
            const value = this._store[key]
            if (value) return f(null, value)
            const err = new Error('data not found')
            err.name = err.type = 'NotFoundError'
            f(err)
        })
    },
    put (key, value, timeout, f) {
        process.nextTick(() => {
            this._store[key] = value
            if (timeout)
                this._timeout[key]
                  = setTimeout(() => this.remove(key, () => {}), 1000 * timeout)
            f()
        })
    },
    remove (key, f) {
        process.nextTick(() => {
            remove(this._store, key)
            clearTimeout(this._timeout[key])
            delete this._timeout[key]
            f()
        })
    },
    _store: {},
    _timeout: {}
}

function remove (store, key) {
    delete store[key]
}

const man  = new SessionMan(store, {timeout: 1})
const port = 9999

var ID

test('クッキーセッションを適用する', t => {
    setup(session((ses, req, res, params) => {
        t.ok(ses.id, ses.id)
        ses.get((err, result) => {
            t.is(err.type, 'NotFoundError', 'error.type eq "NotFoundError"')
            t.notOk(result, 'no result')
            res.end(ses.id)
        })
    }), app => {
        app.once('close', () => t.end())
        const hyp = hyperquest(`http://0.0.0.0:${port}/`)
        hyp.once('response', response => {
            const cookie = response.headers['set-cookie']
            const result = cookie[0].match(/^session=(\w+?); path=(.+?); (httpOnly)$/)
            t.ok(result, 'response.headers["set-cookie"][0].match(/^session=(\w+?); path=(.+?); (httpOnly)$/))')
            t.ok(result[1], 'session value: ' + result[1])
            t.is(result[2], '/', 'path=/')
            t.ok(result[3], 'existss "httOnly"')
            ID = result[1]
            store.get(result[1], (err, res) => {
                t.notOk(res, 'store.get("' + result[1] + '") => no result')
                t.is(err.type, 'NotFoundError', 'error.type eq "NotFoundError" # store does not save data')
                app.close()
            })
        })
    })
})

test('セッションを開始する', t => {
    setup(session((ses, req, res, params) => {
        ses.get((err, data) => {
            t.notOk(data, 'ses.get() => no exists data')
            t.is(err.type, 'NotFoundError', 'err.type eq "NotFoundError"')
            console.log('# ses.put("Foo")')
            ses.put('Foo', err => {
                t.notOk(err, 'no exists error')
                res.end(ses.id)
            })
        })
    }), app => {
        app.once('close', () => t.end())
        const hyp = hyperquest(`http://0.0.0.0:${port}/`)
        hyp.setHeader('cookie', 'session=' + ID)
        hyp.once('response', response => {
            const cookie = response.headers['set-cookie']
            const result = cookie[0].match(/^session=(\w+?); path=(.+?); (httpOnly); max-age=(\d+?)$/)
            t.ok(result, 'response.headers["set-cookie"][0].match(/^session=(\w+?); path=(.+?); (httpOnly); max-age=(\d+?)$/))')
            t.is(result[1], ID, 'session value: "' + ID + '" # 初回アクセス時と同じ値')
            t.is(result[2], '/', 'path=/')
            t.ok(result[3], 'existss "httOnly"')
            t.is(result[4], '1', 'max-age=1')
            store.get(result[1], (err, res) => {
                t.notOk(err, 'store.get("' + result[1] + '") => no exists error')
                t.is(res, 'Foo', 'result eq "Foo"')
                app.close()
            })
        })
    })
})

test('クライアントから送られたCookie値でデータにアクセスできるか', t => {
    setup(session((ses, req, res, params) => {
        ses.get((err, data) => {
            t.notOk(err, 'no exists error')
            t.is(data, 'Foo', 'data eq "Foo"')
            res.end(ses.id)
        })
    }), app => {
        app.once('close', () => t.end())
        const hyp = hyperquest(`http://0.0.0.0:${port}/`)
        hyp.setHeader('cookie', 'session=' + ID)
        hyp.once('response', response => {
            const cookie = response.headers['set-cookie']
            t.notOk(cookie, 'no exists response.headers["set-cookie"]')
            store.get(ID, (err, res) => {
                t.notOk(err, 'store.get("' + ID + '") => no exists error')
                t.is(res, 'Foo', 'result eq "Foo"')
                app.close()
            })
        })
    })
})

test('session.removeが正常に働いているか', t => {
    setup(session((ses, req, res, params) => {
        ses.get((err, data) => {
            t.notOk(err, 'no exists error')
            t.is(data, 'Foo', 'data eq "Foo"')
            ses.remove( err => {
                t.notOk(err, 'no exists error # ses.remove')
                res.end(ses.id)
            })
        })
    }), app => {
        app.once('close', () => t.end())
        const hyp = hyperquest(`http://0.0.0.0:${port}/`)
        hyp.setHeader('cookie', 'session=' + ID)
        hyp.once('response', response => {
            const cookie = response.headers['set-cookie']
            const result = cookie[0].match(/^session=(\d); path=(.+?); (httpOnly); expires=(.+?)$/)
            const d      = (new Date(0)).toUTCString()
            t.ok(result, 'response.headers["set-cookie"][0].match(/^session=(\w+?); path=(.+?); (httpOnly); expires=(.+?)$/)')
            t.is(result[1], '1', 'session value: "1"')
            t.is(result[2], '/', 'path=/')
            t.ok(result[3], 'existss "httOnly"')
            t.is(result[4], d, 'expires=' + d)
            store.get(ID, (err, res) => {
                t.notOk(res, 'store.get("' + ID + '") => no exists data')
                t.is(err.type, 'NotFoundError', 'error.type eq "NotFoundError"')
                app.close()
            })
        })
    })
})


function setup (onReq, onListen) {
    const app = http.createServer((req, res) => {
        const opt = url.parse(req.url, true)
        onReq(req, res, opt.query)
    })

    app.listen(port, () => onListen(app))
}

function session (f) {
    return (req, res, params) => {
        const ses = man.create(req, res, {httpOnly: true})
        f(ses, req, res, params)
    }
}
