module.exports = exports = Cookie

function Cookie (req, res, _opt) {
    if (!(this instanceof Cookie)) return new Cookie(req, res, _opt)
    if (typeof _opt === 'string') _opt = {div: _opt}
    if (! _opt) _opt = {}

    this.cookies    = this.parse(req.headers.cookie)
    this.setCookies = {}
    this.response   = res
    this.div        = _opt.div || '; '
}


Cookie.prototype.get = function (key) {
    return this.cookies[key]
}

Cookie.prototype.put = function (key, value, _opt) {
    _opt      || (_opt = {})
    _opt.path || (_opt.path = '/')
    var keyAndValue = [key, value].map(encodeURIComponent).join('=')
    var options = Object.keys(_opt).map(function (key) {
        return _opt[key] === true ? key : [key, _opt[key]].join('=')
    }).join(this.div)

    this.setCookies[key] = [keyAndValue, options].join(this.div)

    var setCookies = Object.keys(this.setCookies).map(map.bind(this))
    return this.response.setHeader('set-cookie', setCookies)

    function map (key) { return this.setCookies[key] }
}

Cookie.prototype.remove = function (key, _opt) {
    _opt || (_opt = {})
    var opt = {}
    for (var p in _opt) {
        if (Object.prototype.hasOwnProperty.apply(_opt, [p])) {
            var prop = p.replace('-', '').toUpperCase()
            if (prop !== 'MAXAGE' && prop !== 'EXPIRES') opt[p] = _opt[p]
        }
    }
    opt.expires = (new Date(0)).toUTCString()
    return this.put(key, '1', opt)
}

Cookie.prototype.parse = function (str) {
    return str ? str.split(/[;,]\s*/).reduce(function (cookies, str) {
        var pair = str.split('=').map(trim)
        cookies[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1])
        return cookies
    }, {}) : {}

    function trim (str) { return str.trim() }
}
