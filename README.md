# session-man

session manager

```js
var http         = require('http')
var url          = require('url')
var SessionMan   = require('session-man')
var sessionModel = require('./session/model')
var session      = new SessionMan(sessionModel, {
    key: 'app.session'
  , timeout: 30 * 60 // 30min
})

var app = http.createServer((req, res) => {
    var ses      = session.create(req, res, {httpOnly: true})
    var pathname = url.parse(req.url).pathname

    if (pathname === '/countup')
        return count(c => c + 1)

    if (pathname === '/countdown')
        return count(c => c - 1)

    if (pathname === '/destroy')
        return ses.remove(err => {
            if (err) onEror(err)
            else     print('destroy count')
        })

    else
        res.end('go to "/countup", "/countdown", "/destroy"')

    function count (f) {
        ses.get((err, count) => {
            if (err && err.type !== 'NotFoundError') return onError(err)
            var c = f(Number(c || 0))
            ses.put(String(c), err => {
                if (err) onError(err)
                else print(c)
            })
        })
    }

    function print (c) {
        res.statusCode = 200
        res.end(String(c))
    }

    function onError (err) {
        res.statusCode = 500
        res.end(String(err))
        console.dir(err)
    }
})

app.listen(9999)
```
