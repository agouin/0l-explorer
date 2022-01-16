const Router = require('@koa/router')
const { getTowerState } = require('../lib/api/node')

const router = new Router({prefix: '/tower'})

router.post('/inactive', async ctx => {
  const accounts = ctx.request.body
  if (!Array.isArray(accounts)) {
    ctx.status = 400
  }
  const towerMap = {}
  await Promise.all(accounts.map(async account => {
    const towerState = await getTowerState({account})
    const { actual_count_proofs_in_epoch, verified_tower_height } = towerState.data.result
    towerMap[account] = { actual_count_proofs_in_epoch, verified_tower_height }
  }))
  ctx.body = towerMap
})

module.exports = router

