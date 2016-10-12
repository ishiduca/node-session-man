'use strict'
const path     = require('path')
const fs       = require('fs')
const hammer   = require('hogan-hammer')

module.exports = (config) => {
    return {
        app:     app
      , signup:  signup
      , signin:  signin
      , signout: signout
      , post: {
            signup: postSignup
          , signin: postSignin
        }
    }

    function app (ses, req, res, params) {
        ses.get((err, user) => {
            if (!user) return redirect('/signin', res)
            render(path.join(config.templates, 'app.html'), {
                TITLE: 'app'
              , USER: user
              , MENU: [
                    {TEXT: 'sign out', HREF: '/signout'}
                ]
            }, res)
        })
    }

    function signup (req, res, params) {
        render(path.join(config.templates, 'signin.html'), {
            TITLE: 'Sign up'
          , METHOD: 'POST'
          , ACTION: '/signup'
          , SUBMIT_BUTTON: 'Sign up'
          , MENU: [
                {TEXT: 'sign out', HREF: '/signout'}
              , {TEXT: 'sign in', HREF: '/signin'}
            ]
        }, res)
    }

    function signin (ses, req, res, params) {
        ses.get((err, user) => {
            if (user) return redirect('/', res)

            render(path.join(config.templates, 'signin.html'), {
                TITLE: 'Sign in'
              , METHOD: 'POST'
              , ACTION: '/signin'
              , SUBMIT_BUTTON: 'Sign in'
              , MENU: [
                    {TEXT: 'sign out', HREF: '/signout'}
                  , {TEXT: 'sign up', HREF: '/signup'}
                ]
            }, res)
        })
    }

    function signout (ses, req, res, params) {
        ses.remove(err => {
            if (err) onError(err, res)
            else     redirect('/signin', res)
        })
    }

    function postSignup (ses, req, res, params) {
        const accounts = config.accounts
        accounts.get(params.screen_name, (err, user) => {
            if (err && err.type === 'NotFoundError') return put()
            else if (user) {
                err = new Error('this "screen_name" is already in use')
                err.name = 'ScreenNameError'
                return onError(err, res)
            }
            else onError(err, res)
        })

        function put () {
            accounts.put(params.screen_name, params, err => {
                if (err) return onError(err, res)
                ses.put(params.screen_name, err => {
                    if (err) return onError(err, res)
                    else redirect('/', res)
                })
            })
        }
    }

    function postSignin (ses, req, res, params) {
        const accounts = config.accounts
        accounts.get(params.screen_name, (err, user) => {
            if (err) return onError(err, res)
            else if (user.password !== params.password) {
                err = new Error('wrong "password" - ' + params.password)
                err.name = 'PasswordError'
                err.data = params
                console.dir(params)
                console.dir(user)
                return onError(err, res)
            }
            else {
                ses.put(params.screen_name, err => {
                    if (err) return onError(err, res)
                    else redirect('/', res)
                })
            }
        })
    }
}

function render (html, opt, res) {
    const ham = hammer().once('error', err => onError(err, res))

    fs.createReadStream(html).once('error', err => onError(err, res))
      .pipe(ham).pipe(res)

    ham.ws.end(opt)
}

function redirect (loc, res) {
    res.statusCode = 302
    res.setHeader('location', loc)
    res.setHeader('content-length', 0)
    res.setHeader('connection', 'close')
    res.end()
}

function onError (err, res) {
    res.statusCode = err.statusCode || 500
    res.end(String(err))
    console.log(err)
}
