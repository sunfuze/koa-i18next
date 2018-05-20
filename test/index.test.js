import http from 'http'
import test from 'ava'
import agent from 'supertest'
import path from 'path'
import Koa from 'koa'
import Router from 'koa-router'
import session from 'koa-session'
import i18next from 'i18next'
import i18nextBackend from 'i18next-sync-fs-backend'
import i18n from '../src/index'

const debug = require('debug')('koa:i18next')

const defaultConfig = {
  lookupCookie: 'i18next',
  lookupQuerystring: 'lng',
  lookupPath: 'lng',
  order: ['querystring', 'cookie', 'header', 'path', 'session']
}

function request (app) {
  return agent(http.createServer(app.callback()))
}

request.agent = function (app) {
  return agent.agent(http.createServer(app.callback()))
}

function appFactory (config = {}) {
  const app = new Koa()
  app.keys = ['abc', 'edf']
  app.use(session(app))
  app.use(i18n(i18next, Object.assign({}, defaultConfig, config)))
  // add routes
  const router = new Router()
  router.get('/', action)
  router.get('/zh/hello', action)
  router.get('/v1/:lng/hello', action)
  router.get('/session', async function(ctx, next) {
    ctx.status = 200
    ctx.session.lng = 'zh'
    await next()
  })
  app.use(router.routes())
  return app
}

async function action(ctx, next) {
  ctx.status = 200
  ctx.body = { message: ctx.t('hello') }
  await next()
}

test.before('init i18next', t => {
  i18next
    .use(i18nextBackend)
    .init({
      backend: {
        loadPath: path.resolve('./locales/{{lng}}/{{ns}}.json'),
        addPath: path.resolve('./locales/{{lng}}/{{ns}}.missing.json')
      },
      preload: ['zh', 'en'],
      fallbackLng: 'en'
    })
  i18next.on('loaded', loaded => {
    debug('loaded resource', loaded)
  })
})

test.cb('set language by header', t => {
  const app = appFactory()
  request(app)
    .get('/')
    .set('Accept-Language', 'zh')
    .expect(200)
    .expect('Content-Language', 'zh')
    .end((err, res) => {
      t.truthy(res.body)
      t.is(res.body.message, '你好')
      t.end()
    })
})

test.cb('set language by cookie', t => {
  const app = appFactory({
    order: ['cookie']
  })

  const cookies = 'i18next=zh'
  let req = request(app).get('/')
  req.cookies = cookies
  req.expect(200, {
    message: '你好'
  }, t.end)
})

test.cb('set language by query', t => {
  const app = appFactory({
    order: ['querystring']
  })
  request(app)
    .get('/?lng=zh')
    .expect(200, {
      message: '你好'
    }, t.end)
})

test.cb('set language by lookupPath', t => {
  const app = appFactory({
    order: ['path']
  })
  request(app)
    .get('/v1/zh/hello')
    .expect(200, {
      message: '你好'
    }, t.end)
})

test.cb('set language by lookup path index', t => {
  const app = appFactory({
    lookupFromPathIndex: 0,
    order: ['path']
  })
  request(app)
    .get('/zh/hello')
    .expect(200, {
      message: '你好'
    }, t.end)
})

test.cb('set language by session', t => {
  const app = appFactory({
    lookupSession: 'lng',
    order: ['session']
  })

  const agent = request.agent(app)
  agent
    .get('/session')
    .expect(200)
    .end((err, res) => {
      agent
        .get('/')
        .expect(200, {
          message: '你好'
        }, t.end)
    })
})

test.cb('wiil set cookie', t => {
  const app = appFactory()
  request(app)
    .get('/v1/zh/hello')
    .set('Accept-Language', 'zh')
    .expect('set-cookie', 'i18next=zh; path=/;')
    .expect(200, {
      message: '你好'
    }, t.end)
})

test.cb('will fallback to en', t => {
  const app = appFactory()
  request(app)
    .get('/v1/de/hello')
    .expect(200, {
      message: 'hi'
    }, t.end)
})
