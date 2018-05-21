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
  .use(Backend)
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
you can use i18next in koa middleware, as:

```javascript
this.t('balabala', options)
```

`i18next.t` arguments are all supported. [i18next.t](http://i18next.com/docs/api/#t)


## Resources middleware
If needed, you can serve the translations with the resources middleware.  
As Koa doesn't come with built-in routing system, you'll have to handle the request path matching by a routing library or by specifying a path in the options.

```javascript
const koaI18next = require('koa-i18next')
...
// Exemple without router
app.use(koaI18next.getResourcesHandler(i18next, {path: '/locales/resources.json'}));

// Exemple with koa-router
app.get('/locales/resources.json', koaI18next.getResourcesHandler(i18next));
```

Requesting `/locales/resources.json?lng=en&ns=fr` will return the translations of the `common` namespace of the `en` language.  
Note:  Multiple languages and namespaces are supported.  

Available options (with default) are :  
```javascript
{
  // Serve resources only if ctx.path match given path (handle every request by default)
  path: false, 
  // Where to look for lng & ns parameters on the context (query, params, ...)
  propertyParam: 'query',   
  // Name of the lng param
  lngParam: 'lng',
  // Name of the ns param
  nsParam: 'ns'
}
```

## Missing Keys middleware
You can handle missing keys with the Missing Keys middleware. It'll need the `bodyparser` in order to get the submitted missing translations.

```javascript
const koaI18next = require('koa-i18next')
...
// Exemple without router
app.use(koaI18next.getMissingKeysHandler(i18next, {path: '/locales/add'}));

// Exemple with koa-router
app.post('/locales/add', koaI18next.getMissingKeysHandler(i18next));
```

Posting on `/locales/add?lng=en&ns=common` with an array of missing message as body will perform a save missing for the `common` namespace and the `en` language.

Available options (with default) are :  
```javascript
{
  // Handle request only if ctx.path match given path 
  path: false, 
  // Where to look for lng & ns parameters on the context (query, params, ...)
  propertyParam: 'query',   
  // Name of the lng params
  lngParam: 'lng',
  // Name of the ns param
  nsParam: 'ns'

}
```

# License
[MIT](http://opensource.org/licenses/MIT)
