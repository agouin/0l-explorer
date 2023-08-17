const Koa = require('koa')
const Router = require('@koa/router')
const bodyParser = require('koa-bodyparser')
const Next = require('next')
const http = require('http')
const proofsRouter = require('./routers/proofs')
const epochsRouter = require('./routers/epochs')
const towerRouter = require('./routers/tower')
const nodeProxy = require('./routers/nodeProxy')
const webmonitorProxy = require('./routers/webMonitor')
const { Server } = require("socket.io")
const { getCurrentConsensusRound } = require('./lib/api/validator')

const { NODE_ENV, PORT: ENV_PORT } = process.env
const PORT = ENV_PORT || 3027

const app = new Koa()
app.use(bodyParser())

const next = Next({ dev: NODE_ENV != 'production' })
const handler = next.getRequestHandler()

next.prepare()

const router = new Router()

router.get('/health', async (ctx) => {
  ctx.body = 'OK'
})

router.get('/(.*)', async (ctx) => {
  await handler(ctx.req, ctx.res)
  ctx.respond = false
})


app.use(nodeProxy.routes())
app.use(webmonitorProxy.routes())
app.use(epochsRouter.routes())
app.use(proofsRouter.routes())
app.use(towerRouter.routes())
app.use(router.routes())

app.on('error', (error) => {
  console.error('App error', error)
})

const httpServer = http.createServer(app.callback())

const io = new Server(httpServer)

const EventSource = require('eventsource')

const { WEB_MONITOR_HOSTNAME } = process.env

const startVitals = async () => {
  const uri = `http://${WEB_MONITOR_HOSTNAME}:3030/vitals`
    try {
      const sse = new EventSource(uri)
      sse.onmessage = async (msg) => {
        global.consensusRound = await getCurrentConsensusRound()
        global.vitalsCache = JSON.parse(msg.data)
        io.emit('vitals', {
          consensusRound: global.consensusRound,
          vitals: global.vitalsCache,
        })
      }
      sse.onerror = (err) => {
        console.error(`Event source error: ${err}`)
        sse.close()
        setTimeout(startVitals, 10000)
      }
    } catch (err) {
      setTimeout(startVitals, 10000)
    }
}

startVitals()

global.getVitals = () => global.vitalsCache || {
  chain_view: {
    epoch: 0,
    height: 0,
    validator_count: 0,
    latest_epoch_change_time: 0,
    waypoint: '',
    //@ts-ignore
    upgrade: {},
    epoch_progress: 0,
    total_supply: 0,
    validator_view: [],
  },
}

io.on('connection', (socket) => {
  console.log('a user connected')
})
httpServer.listen(PORT)
console.log('Listening on port', PORT)
