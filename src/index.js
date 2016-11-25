import convert from 'koa-convert'
import detect from './detect'

const debug = require('debug')('koa:i18next')

export default function (i18next, options = {}) {

  if (options.next) {
    return convert(middleware)
  } else {
    return middleware
  }

  function* middleware(next) {
    this.i18next = i18next
    let {
      lookupCookie,
      lookupSession
    } = options

    let lng = detect(this, options)
    lng && setLanguage(this, lng, options)

    debug('language is', lng)

    const context = this
    this.t = function (...args) {
      let key
      let opts
      // do detect path
      if (!lng && isDetectPath(options.order)) {
        lng = detect(context, Object.assign(options, {order: ['path']}))
        lng && setLanguage(context, lng, options)
      }

      if (args.length === 1) {
        args.push({})
      }

      for (let i = 0, len = args.length; i < len; i++) {
        let arg = args[i]
        if (typeof arg === 'object' && !Array.isArray(arg)) {
          arg.lng = lng
        }
      }
      return i18next.t.apply(i18next, args)
    }

    yield * next
  }
}

function isDetectPath(order = []) {
  return order.indexOf('path') !== -1
}

function setLanguage (context, lng, options = {}) {
  const {
    lookupCookie
    , lookupPath
    , lookupSession
  } = options
  context.locals = Object.assign(context.locals || {}, {lng})
  context.state = Object.assign(context.state || {}, {lng})
  context.language = context.lng = lng
  context.set('content-language', lng)
  if (lookupCookie) {
    context.cookies.set(lookupCookie, lng)
  }
  if (lookupSession && context.session) {
    context.session[lookupSession] = lng
  }
}
