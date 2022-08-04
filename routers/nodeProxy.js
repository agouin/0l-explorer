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

router.get('/account-transactions', async (ctx) => {
  const { start, limit, address } = ctx.query
  const { data, status } = await getAccountTransactions({
    account: address,
    start: parseInt(start),
    limit: parseInt(limit),
    includeEvents: true,
  })
  ctx.status = status
  ctx.body = data
})

router.get('/events', async (ctx) => {
  const { start, limit, address } = ctx.query
  const eventsKey = `0000000000000000${address}`
  const { data, status } = await getEvents({ 
    key: eventsKey, 
    start: parseInt(start),
    limit: parseInt(limit),
  })
  ctx.status = status
  ctx.body = data
})

var epochEvents = {}

router.get('/epoch-events', async (ctx) => {
  const { address } = ctx.query
  const events = []
  for (const epoch in epochEvents) {
    events.push(...epochEvents[epoch].filter(
      (event) => get(event, 'data.sender', '').toLowerCase() === address
    ))
  }
  ctx.body = events
})



const updateValidatorEpochStats = async () => {
  const epochsRes = await getEpochsStats()
  if (epochsRes.status !== 200) {
    console.error('Error fetching epoch stats')
    return
  }

  for (const epoch of epochsRes.data) {
    if (epochEvents[epoch.epoch]) {
      continue
    }
    const epochRes = await getTransactions({
      startVersion: epoch.height,
      limit: 2,
      includeEvents: true,
    })
    if (epochRes.status !== 200) {
      console.log('one of the epoch res had an error')
      return
    }
    if (!epochEvents[epoch.epoch]) epochEvents[epoch.epoch] = []
    for (const result of epochRes.data.result) {
      if (get(result, 'events.length')) {
        const newEvents = result.events.filter(
          (event) => event.data.type === 'sentpayment' /* &&
              get(event, 'data.sender', '').toLowerCase() === address*/
        ).map(event => {
          event.timestamp = result.transaction.timestamp_usecs
          return event
        })
        if (newEvents.length === 0) {
          continue
        }
        epochEvents[epoch.epoch].push(...newEvents)
      }
    }
  }
}

setInterval(updateValidatorEpochStats, 60000)
updateValidatorEpochStats()

module.exports = router
