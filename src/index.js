import detect from './detect'

const debug = require('debug')('koa:i18next')

export default function koaI18next(i18next, options = {}) {

  return async function i18nextMiddleware(ctx, next) {
    ctx.i18next = i18next
    let {
      lookupCookie,
      lookupSession
    } = options

    let lng = detect(ctx, options)
    lng && setLanguage(ctx, lng, options)

    debug('language is', lng)

    ctx.t = function (...args) {
      let key
      let opts
      // do detect path
      if (!lng && isDetectPath(options.order)) {
        lng = detect(ctx, Object.assign(options, {order: ['path']}))
        lng && setLanguage(ctx, lng, options)
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

    await next()
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
    context.cookies.set(lookupCookie, lng, { httpOnly: false, signed: false });
  }
  if (lookupSession && context.session) {
    context.session[lookupSession] = lng
  }
}
