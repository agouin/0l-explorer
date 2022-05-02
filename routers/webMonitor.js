const Router = require('@koa/router')
const EventSource = require('eventsource')
const router = new Router({ prefix: '/api/webmonitor' })

const { WEB_MONITOR_HOSTNAME } = process.env

const getVitals = () =>
  new Promise((res, rej) => {
    const uri = `http://${WEB_MONITOR_HOSTNAME}:3030/vitals`
    try {
      const sse = new EventSource(uri)
      sse.onmessage = (msg) => {
        sse.close()
        res(JSON.parse(msg.data))
      }
      sse.onerror = (err) => {
        sse.close()
        res({
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
        })
        //rej(err)
      }
    } catch (err) {
      rej(err)
    }
  })

router.get('/vitals', async (ctx) => {
  ctx.body = await getVitals()
})

module.exports = router