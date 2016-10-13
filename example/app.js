'use strict'
const http       = require('http')
const url        = require('url')
const router     = new (require('router-line').Router)
const ecstatic   = require('ecstatic')(__dirname + '/public')
const body       = require('body/any')
const xtend      = require('xtend')
const store      = require('session/store')(__dirname + '/session/store')
const sessionMan = require('session-man')(store, {
    key: 'app.test.session'
  , timeout: 5 * 60// 5min
})
const levelup        = require('levelup')
const accountsDb     = levelup(__dirname + '/dbs/accounts', {valueEncoding: 'json'})
const accountsSchema = require('model/validate/account')

const api = require('api')({
    accounts: require('model/account')(accountsDb, accountsSchema)
  , templates: __dirname + '/html'
})

router.GET('/',        session(api.app))
router.GET('/signin',  session(api.signin))
router.GET('/signout', session(api.signout))
router.GET('/signup',  api.signup)
router.POST('/signup', post(session(api.post.signup)))
router.POST('/signin', post(session(api.post.signin)))

const port = process.env.PORT || 9999

const app = module.exports = http.createServer((req, res) => {
    const opt = url.parse(req.url, true)
    const result = router.route(req.method.toUpperCase(), opt.pathname)
    if (result) result.value(req, res, xtend(opt.query, result.params))
    else        ecstatic(req, res)
})

if (!module.parent) {
    app.listen(port, () => console.log(`port: "${port}"`))
}

function session (f) {
    return (req, res, params) => {
        const ses = sessionMan.create(req, res)
        f(ses, req, res, params)
    }
}

function post (f) {
    return (req, res, params) => {
        body(req, res, (err, data) => {
            if (err) onError(err, res)
            else f(req, res, xtend(params, data))
        })
    }
}

function onError (err, res) {
    res.statusCode = err.statusCode || 500
    res.end(String(err))
    console.error(err)
}
