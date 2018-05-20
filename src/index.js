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
        lng = detect(ctx, Object.assign(options, { order: ['path'] }))
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


function setPath(object, path, newValue) {
  let stack;
  if (typeof path !== "string") stack = [].concat(path);
  if (typeof path === "string") stack = path.split(".");

  while (stack.length > 1) {
    let key = stack.shift();
    if (key.indexOf("###") > -1) key = key.replace(/###/g, ".");
    if (!object[key]) object[key] = {};
    object = object[key];
  }

  let key = stack.shift();
  if (key.indexOf("###") > -1) key = key.replace(/###/g, ".");
  object[key] = newValue;
}

koaI18next.getResourcesHandler = function (i18next, options) {
  options = options || {};
  let maxAge = options.maxAge || 60 * 60 * 24 * 30;
  const propertyParam = options.propertyParam || 'query';

  return async function (ctx, next) {
    if (options.path && ctx.path !== options.path) {
      return await next();
    }
    if (!i18next.services.backendConnector) return ctx.throw(404, "i18next-express-middleware:: no backend configured");

    let resources = {};

    ctx.type = "json";
    if (options.cache !== undefined ? options.cache : process.env.NODE_ENV === "production") {
      ctx.set("Cache-Control", "public, max-age=" + maxAge);
      ctx.set("Expires", new Date(new Date().getTime() + maxAge * 1000).toUTCString());
    } else {
      ctx.set("Pragma", "no-cache");
      ctx.set("Cache-Control", "no-cache");
    }

    let languages = ctx[propertyParam][options.lngParam || "lng"] ? ctx[propertyParam][options.lngParam || "lng"].split(" ") : [];
    let namespaces = ctx[propertyParam][options.nsParam || "ns"] ? ctx[propertyParam][options.nsParam || "ns"].split(" ") : [];

    // extend ns
    namespaces.forEach(ns => {
      if (i18next.options.ns && i18next.options.ns.indexOf(ns) < 0) i18next.options.ns.push(ns);
    });

    i18next.services.backendConnector.load(languages, namespaces, function () {
      languages.forEach(lng => {
        namespaces.forEach(ns => {
          setPath(resources, [lng, ns], i18next.getResourceBundle(lng, ns));
        });
      });
      ctx.body = resources;
    });
  };
}

koaI18next.getMissingKeyHandler = function (i18next, options) {
  options = options || {};
  const propertyParam = options.propertyParam || 'query';

  return async function (ctx, next) {
    if (options.path && ctx.path !== options.path) {
      return await next();
    }
    let lng = ctx[propertyParam][options.lngParam || "lng"];
    let ns = ctx[propertyParam][options.nsParam || "ns"];

    if (!i18next.services.backendConnector) return ctx.throw(404, "i18next-express-middleware:: no backend configured");

    for (var m in ctx.request.body) {
      i18next.services.backendConnector.saveMissing([lng], ns, m, ctx.request.body[m]);
    }
    ctx.body = "ok";
  };
}

function isDetectPath(order = []) {
  return order.indexOf('path') !== -1
}

function setLanguage(context, lng, options = {}) {
  const {
    lookupCookie
    , lookupPath
    , lookupSession
  } = options
  context.locals = Object.assign(context.locals || {}, { lng })
  context.state = Object.assign(context.state || {}, { lng })
  context.language = context.lng = lng
  context.set('content-language', lng)
  if (lookupCookie) {
    context.cookies.set(lookupCookie, lng, { httpOnly: false, signed: false });
  }
  if (lookupSession && context.session) {
    context.session[lookupSession] = lng
  }
}
