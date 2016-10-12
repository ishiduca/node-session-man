var uuid   = require('uuid')
var xtend  = require('xtend')
var Cookie = require('./lib/cookie')

module.exports = exports = SessionMan
SessionMan.Session       = Session


var defaultCookieOption = {
    path: '/'
//  , httpOnly: true
}

function SessionMan (store, config) {
    if (!(this instanceof SessionMan)) return new SessionMan(store, config)

    if (! store) throw new Error('"store" not found')

    config || (config = {})
    this.store   = store
    this.key     = config.key || 'session'
    this.timeout = config.timeout || 60 * 60 //sec
}

SessionMan.prototype.create = function (req, res, _cookieOption) {
    return new Session(req, res, {
        cookieOption: xtend(defaultCookieOption, _cookieOption)
      , timeout:      this.timeout
      , key:          this.key
      , store:        this.store
    })
}

function Session (req, res, option) {
    if (!(this instanceof Session)) return new Session(req, res, option)

    this.store        = option.store
    this.key          = option.key
    this.timeout      = option.timeout
    this.cookie       = new Cookie(req, res)
    this.cookieOption = option.cookieOption
    this.id           = this.cookie.get(this.key)

    if (!this.id) {
        this.id = uuid.v4().split('-').join('')
        this.cookie.put(this.key, this.id, this.cookieOption)
    }
}

Session.prototype.put = function (value, f) {
    var me = this
    this.store.put(this.id, value, this.timeout, function (err) {
        if (err) return f(err)
        var opt = {'max-age': me.timeout}
        me.cookie.put(me.key, me.id, xtend(me.cookieOption, opt))
        f()
    })
}

Session.prototype.get = function (f) {
    var me = this
    this.store.get(this.id, function (err, result) {
        if (err) return f(err)
        if (! result) {
            err = new Error('data not found')
            err.name = err.type = 'NotFoundError'
            return f(err)
        }
        f(null, result)
    })
}

Session.prototype.remove = function (f) {
    var me = this
    this.store.remove(this.id, function (err) {
        if (err) return f(err)
        me.cookie.remove(me.key, me.cookieOption)
        f()
    })
}
