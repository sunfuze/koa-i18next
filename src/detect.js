const debug = require('debug')('koa:i18next');

const DEFAULT_ORDER = ['querystring', 'cookie', 'header'];

const detectors = {
  cookie: function(context, options) {
    let cookie = options.lookupCookie || 'i18next';
    return context.cookies.get(cookie);
  },

  // fork from i18next-express-middleware
  header: function(context) {
    let acceptLanguage = context.get('accept-language');
    let found;
    let locales = [];
    if (acceptLanguage) {
      let lngs = [];

      // associate language tags by their 'q' value (between 1 and 0)
      acceptLanguage.split(',').forEach(function(l) {
        let parts = l.split(';'); // 'en-GB;q=0.8' -> ['en-GB', 'q=0.8']

        // get the language tag qvalue: 'q=0.8' -> 0.8
        let qvalue = 1; // default qvalue

        for (let i = 0; i < parts.length; i++) {
          let part = parts[i].split('=');
          if (part[0] === 'q' && !isNaN(part[1])) {
            qvalue = Number(part[1]);
            break;
          }
        }
        // add the tag and primary subtag to the qvalue associations
        lngs.push({
          lng: parts[0],
          q: qvalue
        });
      });

      lngs.sort(function(a, b) {
        return b.q - a.q;
      });

      for (let i = 0; i < lngs.length; i++) {
        locales.push(lngs[i].lng);
      }

      if (locales.length) found = locales;
    }

    return found;
  },
  path: function(context, options) {
    let found;

    if (options.lookupPath !== undefined && context.params) {
      found = context.params[options.lookupPath];
    }

    if (!found && options.lookupFromPathIndex !== undefined) {
      let parts = context.path.split('/');
      if (parts[0] === '') {
        // Handle paths that start with a slash, i.e., '/foo' -> ['', 'foo']
        parts.shift();
      }

      if (parts.length > options.lookupFromPathIndex) {
        found = parts[options.lookupFromPathIndex];
      }
    }
    return found;
  },
  querystring: function(context, options) {
    let name = options.lookupQuerystring || 'lng';
    return context.query[name];
  },

  session: function(context, options) {
    let name = options.lookupSession || 'lng';
    return context.session && context.session[name];
  }
};

export default function(context, options = {}) {
  let { order, fallback } = options;
  order = order && Array.isArray(order) ? order : DEFAULT_ORDER;

  let lngs = [];

  for (let i = 0, len = order.length; i < len; i++) {
    let detector = detectors[order[i]];
    let lng;
    if (detector) {
      lng = detector(context, options);
    }
    if (lng && typeof lng === 'string') {
      lngs.push(lng);
    } else {
      lngs = lngs.concat(lng);
    }
  }
  let found;
  for (let i = 0, len = lngs.length; i < len; i++) {
    let cleanedLng = context.i18next.services.languageUtils.formatLanguageCode(
      lngs[i]
    );
    if (context.i18next.services.languageUtils.isSupportedCode(cleanedLng))
      found = cleanedLng;
    if (found) break;
  }

  return found || fallback;
}
