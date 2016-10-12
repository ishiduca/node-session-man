'use strict'
const http   = require('http')
const test   = require('tape')
const Cookie = require('cookie')

const cookieStr = 'logged_in=yes; user_session=aKXfSb5Ppy%3D--; tz=Asia%2FTokyo'

test('var cookie = new Cookie(req, res, opt)', t => {
    t.is(Cookie({headers: {cookie: cookieStr}}, new http.ServerResponse({method: 'GET'}), ', ').div, ', ', 'Cookie(request, response, ", ").div eq ", "')
    t.is(new Cookie({headers: {cookie: cookieStr}}, new http.ServerResponse({method: 'GET'}), {div: '&'}).div, '&', 'Cookie(request, response, {div: "&"}).div eq "&"')
    t.end()
})

test('value = cookie.get(key)', t => {
    const cookie = new Cookie({headers: {cookie: cookieStr}}, new http.ServerResponse({mehtod: 'GET'}))
    t.is(cookie.get('logged_in'), 'yes', 'cookie.get("logged_in") eq "yes"')
    t.is(cookie.get('tz'), 'Asia/Tokyo', 'cookie.get("tz"), eq "Asia/Tokyo"')
    t.is(cookie.get('user_session'), 'aKXfSb5Ppy=--', 'cookie.get("user_session") eq "aKXfSb5Ppy=--"')

    t.end()
})

test('cookie.put(key, value[, _opt])', t => {
    const res    = new http.ServerResponse({mehtod: 'GET'})
    const cookie = new Cookie({headers: {}}, res)

    cookie.put('abc', 'A BC', {path: '/test', secure: true})
    cookie.put('def', 'D=EF')
    const setCookie = res._headers['set-cookie']
    t.deepEqual(setCookie, ['abc=A%20BC; path=/test; secure', 'def=D%3DEF; path=/'], "['abc=A%20BC; path=/test; secure', 'def=D%3DEF; path=/']")

    t.end()
})

test('cookie.remove(key[, _opt])', t => {
    const res    = new http.ServerResponse({mehtod: 'GET'})
    const cookie = new Cookie({headers: {}}, res)

    cookie.remove('abc')
    cookie.remove('def', {'max-age': 3600})
    const setCookie = res._headers['set-cookie']
    t.deepEqual(setCookie, ['abc=1; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/', 'def=1; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'], "['abc=1; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/', 'def=1; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/']")
    t.end()
})
