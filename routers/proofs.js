const Router = require('@koa/router')
const { getAccountTransactions, getEvents, getTransactions, getTowerState } = require('../lib/api/node')
const { get } = require('lodash')
const { getValidatorPermissionTree } = require('../lib/api/permissionTree')

const router = new Router({ prefix: '/api/proofs' })

const iterateAllAccountTransactions = async (address, processFunction) => {
  let start = 0

  const first1000Transactions = await getAccountTransactions({
    account: address,
    start,
    limit: 1000,
    includeEvents: false,
  })


  if (first1000Transactions.status !== 200 || first1000Transactions.data.error) return false
  if (!processFunction(first1000Transactions)) return false

  let transactionsCount = get(first1000Transactions, 'data.result.length')

  while (transactionsCount === 1000) {
    start += 1000
    const next1000Transactions = await getAccountTransactions({
      account: address,
      start,
      limit: 1000,
      includeEvents: false,
    })

    if (next1000Transactions.status !== 200 || next1000Transactions.data.error) return false

    if (!processFunction(next1000Transactions)) return false
    transactionsCount = get(next1000Transactions, 'data.result.length')
  }
  return true
}

router.get('/:address', async (ctx) => {
  const { address } = ctx.params

  const eventsKey = `0000000000000000${address}`

  eventsPerFetch = 200

  

  console.log('get latest proof', address)

  let validatorAccountCreatedBy = null,
  operatorAccount = null

  const validatorPermissionTreeRes = await getValidatorPermissionTree(address)
  const isValidator = validatorPermissionTreeRes.status === 200
  if (isValidator || validatorPermissionTreeRes.status === 404) {
    if (isValidator) {
      operatorAccount = validatorPermissionTreeRes.data.operator_address
      validatorAccountCreatedBy = validatorPermissionTreeRes.data.parent
      console.log('found validator from permission tree',{operatorAccount, validatorAccountCreatedBy})
    }
  } else {
    let eventsOffset = 0
    let eventsRes
    let onboardedBy
    do {
      eventsRes = await getEvents({ key: eventsKey, start: 0, limit: eventsPerFetch })
      if (eventsRes.status !== 200) {
        ctx.status = 500
        ctx.body = 'Error fetching account events. Please try again'
        return
      }
      console.log('got events', eventsOffset)
      const filtered = eventsRes.data.result.filter((event) => event.data.sender !== '00000000000000000000000000000000')
      if (filtered.length > 0) {
        console.log('filtered length is > 0')

        const nonZeroEventTransactionsRes = await Promise.all(
          filtered.map((event) => (async () => {
            const res = await getTransactions({
              startVersion: event.transaction_version,
              limit: 1,
              includeEvents: true,
            })
            console.log('fetched transaction', event.transaction_version)
            return res
          })()
          )
        )

        let foundCreateAccVal = false

        for (const transaction of nonZeroEventTransactionsRes) {
          const sender = get(transaction, 'data.result[0].transaction.sender')
          const functionName = get(
            transaction,
            'data.result[0].transaction.script.function_name'
          )
          if (functionName === 'create_acc_val') {
            const events = get(transaction, 'data.result[0].events')
            if (events && events.length > 0) {
              const operatorCreateEvent = events.find(event => get(event, 'data.type') === 'receivedpayment' && get(event, 'data.receiver') !== address.toLowerCase())
              if (operatorCreateEvent) {
                operatorAccount = get(operatorCreateEvent, 'data.receiver')
              }
            }
            validatorAccountCreatedBy = sender
            console.log('found create acc val at', transaction.data.diem_ledger_version)
            foundCreateAccVal = true
            break
          }
          else if (functionName === 'create_user_by_coin_tx') onboardedBy = sender
        }

        if (foundCreateAccVal) break
      }
      eventsOffset += eventsRes.data.result.length
    } while (eventsRes.data.result.length === eventsPerFetch) 

    if (!onboardedBy && !validatorAccountCreatedBy) {
      onboardedBy = 'Genesis'
      const genesisBlock = await getTransactions({
        startVersion: 0,
        limit: 1,
        includeEvents: true,
      })
      const genesisEvents = get(genesisBlock, 'data.result[0].events')
      if (genesisEvents) {
        const operatorCreateEvent = genesisEvents.find(event => get(event, 'data.sender') === address.toLowerCase())
        if (operatorCreateEvent) operatorAccount = get(operatorCreateEvent, 'data.receiver')
      }
    }
  }

  let latestProof

  const towerRes = await getTowerState({account: address})
  if (!towerRes) {
    ctx.status = 404
    ctx.body = 'Tower state does not exist for provided account'
    return
  }

  const towerHeight = towerRes.data.result.verified_tower_height

  if (operatorAccount) {
    let latestProofTransactionVersion = -1
    let latestProofBytes
    let latestProofIsOperator = false
    let runningHeight = 0

    let operatorProofs = 0
    let validatorProofs = 0

    const validatorAddressTransactionsRes = await iterateAllAccountTransactions(address, (transactionsRes) => {
      for (const transaction of transactionsRes.data.result) {
        if (
          transaction.vm_status.type !== 'executed' ||
          get(transaction, 'transaction.script.function_name') !==
            'minerstate_commit'
        )
          continue

        runningHeight++
        validatorProofs++
        if (transaction.version > latestProofTransactionVersion) {
          latestProofBytes = transaction.bytes
          latestProofTransactionVersion = transaction.version
          latestProofIsOperator = false
        }
      }

      return true
    })
    if (!validatorAddressTransactionsRes) {
      ctx.status = 500
      ctx.body = 'Error iterating through all validator account transactions'
      return
    }

    const operatorAddressTransactionsRes = await iterateAllAccountTransactions(operatorAccount, (transactionsRes) => {
      for (const transaction of transactionsRes.data.result) {
        if (
          transaction.vm_status.type !== 'executed' ||
          get(transaction, 'transaction.script.function_name') !==
            'minerstate_commit_by_operator'
        )
          continue
        runningHeight++
        console.log('set latest operator proof', runningHeight)
        operatorProofs++
        if (transaction.version > latestProofTransactionVersion) {
          latestProofBytes = transaction.bytes
          latestProofTransactionVersion = transaction.version
          latestProofIsOperator = true
        }
      }

      return true
    })
    if (!operatorAddressTransactionsRes) {
      ctx.status = 500
      ctx.body = 'Error iterating through all operator account transactions'
      return
    }

    if (!latestProofBytes) {
      ctx.status = 404
      ctx.body = 'Unable to find vdf_proofs for that validator address'
      return
    }

    const preimage = latestProofBytes.substring(
      latestProofIsOperator ? 222 : 164,
      latestProofIsOperator ? 286 : 228
    )
    const proof = latestProofBytes.substring(
      latestProofIsOperator ? 294 : 236,
      latestProofIsOperator ? 3066 : 3008
    )
    latestProof = {
      height: runningHeight,
      preimage,
      proof,
      elapsed_secs: 2000,
      difficulty: 120000000,
      security: 512
    }
  } else {
    let runningHeight = 0

    const allAccountTransactionsRes = await iterateAllAccountTransactions(address, (transactionsRes) => {
        for (const transaction of transactionsRes.data.result) {
          if (
            transaction.vm_status.type !== 'executed' ||
            get(transaction, 'transaction.script.function_name') !==
              'minerstate_commit'
          )
            continue

          const { bytes } = transaction
          const preimage = bytes.substring(
            runningHeight === 0 ? 168 : 164,
            runningHeight === 0 ? 2216 : 228
          )
          const proof = bytes.substring(
            runningHeight === 0 ? 2224 : 236,
            runningHeight === 0 ? 4996 : 3008
          )
          const height = runningHeight++
          latestProof = {
            height,
            preimage,
            proof,
            elapsed_secs: 2000,
            difficulty: 120000000,
            security: 512,
          }
          console.log('set latest proof', height)
        }

        return true
    })
    if (!allAccountTransactionsRes) {
      ctx.status = 500
      ctx.body = 'Error iterating through all miner account transactions'
      return
    }
  }

  if (!latestProof) {
    ctx.status = 404
    ctx.body = 'Unable to find vdf_proofs for that address'
    return
  }

  if (latestProof.height !== towerHeight) {
    console.warn('Latest proof height does not equal tower height!', { latestProofHeight: latestProof.height, towerHeight})
  }

  latestProof.height = towerHeight

  ctx.type = 'application/json'
  ctx.body = latestProof
  ctx.response.attachment(
    `proof_${towerHeight}.json`
  )
})

module.exports = router
