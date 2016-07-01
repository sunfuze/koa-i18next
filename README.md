# Introduction
A middleware to use i18next in koajs.

# Getting started
install dependencies
```bash
npm install koa-i18next
```
## working with backend

```javascript
const koa = require('koa')
const i18next = require('i18next')
const Backend = require('i18next-sync-fs-backend') // or i18next-node-fs-backend
const koaI18next = require('koa-i18next')

i18next
  .init({
    backend: {
      // translation resources
      loadPath: path.resolve('./locales/{{lng}}/{{ns}}.json'),
      addPath: path.resolve('./locales/{{lng}}/{{ns}}.missing.json')
    },
    preload: ['zh', 'en'], // must know what languages to use
    fallbackLng: 'en'
  })

const app = koa()
app.use(koaI18next(i18next, {
  lookupCookie: 'i18next', // detecting language in cookie
  /**
  * Detecting language in path params, need third part route middleware.
  * Example
  * path: `/api/:lng/hello
  */
  lookupPath: 'lng',
  lookupFromPathIndex: 0, // detecting language in path, like `/api/zh/hello` which `zh` is the language and the index is 1
  lookupQuerystring: 'lng', // detect language in query,
  lookupSession: 'lng', // detect language in session
  /**
  * support querystring, cookie, header, session, path
  * default order: ['querystring', 'cookie', 'header']
  */
  order: ['querystring'],
  next: true // if koa is version 2
}))
// koa@1.X
app.use(function* (next) {
  this.body = {message: this.t('lalala')}
})
```

## language detection

Support for:
- querystring
- cookie
- header
- session
- path

If you don't config this, it will use ['querystring', 'cookie', 'header'] as default  detecting order.

## options

```javascript
{
  // order and from where user language should be detected
  order: ['querystring', 'cookie', 'header'/*, 'path', 'session'*/],
  // keys or params to lookup language from
  lookupQuerystring: 'lng',
  lookupCookie: 'i18next',
  lookupSession: 'lng',
  lookupPath: 'lng',
  lookupFromPathIndex: 0,
  // if koa is v2
  next: true
}
```

## api
you can using i18next in koa middleware, as:

```javascript
this.t('balabala', options)
```

`i18next.t` arguments are all supported. [i18next.t](http://i18next.com/docs/api/#t)

# License
[MIT](http://opensource.org/licenses/MIT)
