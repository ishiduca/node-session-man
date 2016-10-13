# session-man

session manager

### example

```js
const http       = require('http')
const url        = require('url')
const router     = new (require('router-line').Router)
const store      = require('./lib/session-store')
const sessionMan = require('session-man')(store, {
    timeout: 45
  , key: 'count.session'
})

router.GET('/countup', session((ses, req, res, params) => {
    count(ses, res, (c) => c + 1)
}))

router.GET('/countdown', session((ses, req, res, params) => {
    count(ses, res, (c) => c - 1)
}))

router.GET('/destroy', session((ses, req, res, params) => {
    ses.remove(err => {
        if (err) serverError(err, res)
        else res.end('count destroy')
    })
}))

const app = http.createServer((req, res) => {
    const opt    = url.parse(req.url)
    const result = router.route(req.method.toUpperCase(), opt.pathname)
    if (result) result.value(req, res, result.params)
    else        notFoundError(opt.pathname, res)
})

app.listen(9999, () => {
    console.log(`server start to listen on port "9999"`)
})

function session (f) {
    return (req, res, params) => {
        const ses = sessionMan.create(req, res, {httpOnly: true})
        f(ses, req, res, params)
    }
}

function count (ses, res, f) {
    ses.get((err, _c) => {
        if (err) return serverError(err, res)
        const c = f(_c)
        ses.put(c, err => {
            if (err) serverError(err, res)
            else     res.end(String(c))
        })
    })
}

function serverError (err, res) {
    res.statusCode = 500
    res.end(String(err))
}

function notFoundError (pathname, res) {
    res.statusCode = 404
    res.end(`NotFoundError: "${pathname}" not found`)
}
```
