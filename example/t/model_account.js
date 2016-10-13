'use strict'
const test    = require('tape')
const through    = require('through2')
const levelup = require('levelup')
const db      = levelup(__dirname + '/dbs/accounts', {valueEncoding: 'json'})
const schema  = require('../lib/model/validate/account')
const model   = require('../lib/model/account')(db, schema)

var ID

test('model.create(params, done)', t => {
    setup()

    model.create({
        screen_name: 'Hulk'
      , password:    'hogan0123'
    }, (err, id) => {
        t.notOk(err, 'no exists error')
        t.ok(id, String(id))

        ID = id

        db.get(id, (err, user) => {
            t.is(id, user.id, 'id eq user.id # ' + user.id)
            t.is(user.screen_name, 'Hulk', 'user.screen_name eq "Hulk"')
            t.is(user.password, 'hogan0123', 'user.password eq "hogan0123"')
            t.end()
        })
    })
})

test('model.get(params, done)', t => {
    model.get({
        screen_name: 'Hulk'
      , password: 'hogan0123'
    }, (err, user) => {
        t.notOk(err, 'no exists error')
        t.is(user.screen_name, 'Hulk', 'user.screen_name eq "Hulk"')
        t.is(user.password, 'hogan0123', 'user.password eq "hogan0123"')
        t.end()
    })
})

test('model.get(params, done) # password error', t => {
    model.get({
        screen_name: 'Hulk'
      , password: 'hogan0987'
    }, (err, user) => {
        t.is(err.name, 'PasswordError', 'error.name eq "PasswordError"')
        t.is(err.message, 'wrong password "hogan0987"', 'err.message eq ' + err.message)
        t.notOk(user, 'no exists user')
        t.end()
    })
})

test('model.get(params, done) # screen_name not found error', t => {
    model.get({
        screen_name: 'Haruka'
      , password: 'hogan0123'
    }, (err, user) => {
        t.is(err.name, 'ScreenNameNotFoundError', 'error.name eq "ScreenNameNotFoundError"')
        t.is(err.message, 'screen_name "Haruka" not found', "error.message eq 'screen_name \"Haruka\" not found'")
        t.notOk(user, 'no exists user')
        t.end()
    })
})

test('model.create(params, done) # passed ScreenNameError', t => {
    model.create({
        screen_name: 'Hulk'
      , password:    'fail.case'
    }, (err, id) => {
        t.is(err.message, 'screen_name "Hulk" is already in use', String(err))
        t.notOk(id, '"id" not found')

//        db.del(ID, err => {
//            err && console.log(err)
//            t.end()
//        })
        teardown(t.end.bind(t))
    })
})

function setup () {
    ;[
        {screen_name: 'Tony', password: 'tonytony'}
      , {screen_name: 'Maam', password: '1234567'}
      , {screen_name: 'Hato', password: 'mesumesu'}
    ].forEach(params => {
        var id = String(Math.random() * 1000).replace('.', '-')
        params.id = id
        db.put(id, params, err => {
            if (err) return console.log(err)
            db.get(id, (err, u) => {
                err && console.log(err)
            })
        })
    })
}

function teardown (f) {
    db.createKeyStream().on('error', err => console.log(err))
    .pipe(through.obj((key, _, done) => {
        db.del(key, err => {
            if (err) console.log(err)
            done()
        })
    }, done => {
        done()
        f()
    }))
}
