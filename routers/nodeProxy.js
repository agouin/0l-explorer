const Router = require('@koa/router')
const {
  NodeAPI,
  getAccountTransactions,
  getTransactions,
  getEvents,
} = require('../lib/api/node.js')
const { getEpochsStats } = require('../lib/api/permissionTree.js')
const { getTransactionMin } = require('../lib/node_utils.js')
const { get } = require('lodash')

const router = new Router({ prefix: '/api/proxy/node' })

router.post('(.*)', async (ctx) => {
  const { path, body, headers } = ctx.request
  const nodePath = path.split('/').slice(4).join('/')
  const res = await NodeAPI.POST(nodePath, body, headers)
  ctx.body = res.data
})

module.exports = router

router.get('/transactions', async (ctx) => {
  const { type, address } = ctx.query
  const eventsKey = `0000000000000000${address}`
  const [
    { data: transactionsRes, status: transactionsStatus },
    { data: eventsRes, status: eventsStatus },
  ] = await Promise.all([
    getAccountTransactions({
      account: address,
      start: 0,
      limit: 1000,
      includeEvents: true,
    }),
    getEvents({ key: eventsKey, start: 0, limit: 1000 }),
  ])

  const events = []
  let eventsCount = 0
  if (eventsStatus === 200 && !eventsRes.error) {
    events.unshift(
      ...eventsRes.result.sort(
        (a, b) => b.transaction_version - a.transaction_version
      )
    )
    eventsCount = eventsRes.result.length
  }

  let start = eventsCount
  while (eventsCount === 1000) {
    const nextSetOfEventsRes = await getEvents({
      key: eventsKey,
      start,
      limit: 1000,
    })
    if (nextSetOfEventsRes.status !== 200 || nextSetOfEventsRes.data.error)
      break
    events.unshift(...nextSetOfEventsRes.data.result)
    eventsCount = nextSetOfEventsRes.data.result.length
    start += eventsCount
  }

  const transactions = []

  let transactionsCount = 0
  if (transactionsStatus === 200 && !transactionsRes.error) {
    transactions.unshift(
      ...transactionsRes.result
        .sort((a, b) => b.version - a.version)
        .map((tx) => {
          if (tx.events && tx.events.length) {
            events.unshift(
              ...tx.events.filter((event) => event.data.type === 'sentpayment')
            )
          }
          return getTransactionMin(tx)
        })
    )
    transactionsCount = transactionsRes.result.length
  }

  let startTx = transactionsCount

  while (transactionsCount === 1000) {
    const nextSetOfTransactionsRes = await getAccountTransactions({
      account: address,
      start: startTx,
      limit: 1000,
      includeEvents: true,
    })
    if (
      nextSetOfTransactionsRes.status !== 200 ||
      nextSetOfTransactionsRes.data.error
    )
      break
    transactions.unshift(
      ...nextSetOfTransactionsRes.data.result
        .sort((a, b) => b.version - a.version)
        .map((tx) => {
          if (tx.events && tx.events.length) {
            events.unshift(
              ...tx.events.filter((event) => event.data.type === 'sentpayment')
            )
          }
          return getTransactionMin(tx)
        })
    )
    transactionsCount = nextSetOfTransactionsRes.data.result.length
    startTx += transactionsCount
  }

  if (type === 'Validator') {
    const epochsRes = await getEpochsStats()
    if (epochsRes.status === 200) {
      const epochEventsRes = await Promise.all(
        epochsRes.data.map((epoch) =>
          getTransactions({
            startVersion: epoch.height,
            limit: 2,
            includeEvents: true,
          })
        )
      )
      for (const epochRes of epochEventsRes) {
        if (epochRes.status === 200) {
          for (const result of epochRes.data.result) {
            if (get(result, 'events.length')) {
              events.unshift(
                ...result.events.filter(
                  (event) =>
                    event.data.type === 'sentpayment' &&
                    get(event, 'data.sender', '').toLowerCase() === address
                )
              )
            }
          }
        }
      }
    }
  }
  ctx.body = { transactions, events: events.sort(
    (a, b) => b.transaction_version - a.transaction_version
  ) }
})
