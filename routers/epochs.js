const Router = require('@koa/router')
const { getEvents, getTransactions } = require('../lib/api/node')

const router = new Router({prefix: '/epochs'})

router.get('/', async ctx => {
  const { start: queryStart, limit: queryLimit } = ctx.query
  const start = queryStart ? parseInt(queryStart) : 0
  const limit = queryLimit ? parseInt(queryLimit) : 20
  const epochEventsRes = await getEvents({
    key: '040000000000000000000000000000000000000000000000',
    start,
    limit
  })

  if (epochEventsRes.status !== 200) {
    ctx.status = epochEventsRes.status
    ctx.body = epochEventsRes.statusText
    return
  }

  if (epochEventsRes.data.error) {
    ctx.status = 500
    ctx.body = epochEventsRes.data.error
    return
  }

  if (!epochEventsRes.data || !epochEventsRes.data.result) {
    ctx.status = 400
    ctx.body = []
  }

  const epochTransactions = []
  for (const event of epochEventsRes.data.result) {
    epochTransactions.push(getTransactions({startVersion: event.transaction_version, limit: 1, includeEvents: false}))
  }
  const epochTransactionsRes = await Promise.all(epochTransactions)

  ctx.body = epochEventsRes.data.result.map((event, i) => {
    const expiration = epochTransactionsRes[i].data.result[0].transaction.timestamp_usecs 
    const timestamp = expiration ? (expiration / 1000000) : undefined
    return { epoch: event.data.epoch, height: event.transaction_version, timestamp }
  })
})

module.exports = router

