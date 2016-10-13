'use strict'
const validatoo = require('validatoo')

module.exports = validatoo.schema({
    screen_name: validatoo.validator(
        v => isString(v) && v.length > 2 && v.length < 8
      , 'typeof "screen_name" must be "string" and 3 ~ 7 chars'
    )
  , password: validatoo.validator(
        /^[0-9a-zA-Z\-._]{8,}$/
      , 'typeof "password" must be "string" and over 8 chars'
    )
}, {
    id: validatoo.validator(
        /^[0-9[a-zA-Z\-._]{12,}$/
      , 'typeof "id" msut be "string" and over 12 chars'
    )
})

function isString (str) {
    return typeof str === 'string'
}
