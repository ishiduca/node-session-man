'use strict'
const path     = require('path')
const fs       = require('fs')
const hammer   = require('hogan-hammer')

module.exports = (config) => {
    const accounts  = config.accounts
    const templates = config.templates

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
        ses.get((err, accountId) => {
            if (!accountId) return redirect('/signin', res)
            render(path.join(templates, 'app.html'), {
                TITLE: 'app'
              , USER: accountId
              , MENU: [
                    {TEXT: 'sign out', HREF: '/signout'}
                ]
            }, res)
        })
    }

    function signup (req, res, params) {
        render(path.join(templates, 'signin.html'), {
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
        ses.get((err, accountId) => {
            if (accountId) return redirect('/', res)

            render(path.join(templates, 'signin.html'), {
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
        accounts.create(params, (err, accountId) => {
            if (err) return onError(err, res)
            ses.put(accountId, err => {
                if (err) return onError(err, res)
                else redirect('/', res)
            })
        })
    }

    function postSignin (ses, req, res, params) {
        accounts.get(params, (err, user) => {
            if (err) return onError(err, res)
            ses.put(user.id, err => {
                if (err) return onError(err, res)
                else redirect('/', res)
            })
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
