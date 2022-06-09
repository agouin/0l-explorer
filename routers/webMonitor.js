const Router = require('@koa/router')
const router = new Router({ prefix: '/api/webmonitor' })

router.get('/vitals', async (ctx) => {
  ctx.body = global.getVitals()
})

module.exports = router