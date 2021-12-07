const Koa = require('koa')
const Router = require('@koa/router')
const bodyParser = require('koa-bodyparser')
const Next = require('next')
const http = require('http')
const proofsRouter = require('./routers/proofs')
const epochsRouter = require('./routers/epochs')

const { NODE_ENV, PORT: ENV_PORT } = process.env
const PORT = ENV_PORT || 3027

const app = new Koa()
app.use(bodyParser())

const next = Next({ dev: NODE_ENV != 'production' })
const handler = next.getRequestHandler()

next.prepare()

const router = new Router()

router.get('/(.*)', async (ctx) => {
  await handler(ctx.req, ctx.res)
  ctx.respond = false
})

app.use(epochsRouter.routes())
app.use(proofsRouter.routes())
app.use(router.routes())

app.on('error', (error) => {
  console.error('App error', error)
})

const httpServer = http.createServer(app.callback())
httpServer.listen(PORT)
console.log('Listening on port', PORT)
