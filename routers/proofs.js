const Router = require('@koa/router')
const archiver = require('archiver')
const { getAccountTransactions, getEvents, getTransactions } = require('../lib/api/node')
const { get } = require('lodash')

const router = new Router({ prefix: '/proofs' })

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

  const eventsRes = await getEvents({ key: eventsKey, start: 0, limit: 20 })

  const nonZeroEvents = eventsRes.data.result.filter((event) => event.data.sender !== '00000000000000000000000000000000')

  const nonZeroEventTransactionsRes = await Promise.all(
    nonZeroEvents.map((event) =>
      getTransactions({
        startVersion: event.transaction_version,
        limit: 1,
        includeEvents: true,
      })
    )
  )

  let onboardedBy = null,
    validatorAccountCreatedBy = null,
    operatorAccount = null

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
    }
    else if (functionName === 'create_user_by_coin_tx') onboardedBy = sender
  }

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

  const archive = archiver('zip')

  if (operatorAccount) {
    const proofVersions = {}

    const validatorAddressTransactionsRes = await iterateAllAccountTransactions(address, (transactionsRes) => {
      for (const transaction of transactionsRes.data.result) {
        if (
          transaction.vm_status.type !== 'executed' ||
          get(transaction, 'transaction.script.function_name') !==
            'minerstate_commit'
        )
          continue

        const { bytes } = transaction
        proofVersions[transaction.version] = { bytes, isOperator: false }
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

        const { bytes } = transaction
        proofVersions[transaction.version] = { bytes, isOperator: true }
      }

      return true
    })
    if (!operatorAddressTransactionsRes) {
      ctx.status = 500
      ctx.body = 'Error iterating through all operator account transactions'
      return
    }

    let genesisPreImage = '', genesisProof = ''
    for (let i = 0; i < 2048; i++) genesisPreImage += '0'
    for (let i = 0; i < 2772; i++) genesisProof += '0'

    const genesisProofJson = {
      height: 0,
      preimage: genesisPreImage,
      proof: genesisProof,
      elapsed_secs: 2000,
      difficulty: 120000000,
      security: 512
    }

    archive.append(JSON.stringify(genesisProofJson), {
      name: 'proof_0.json',
    })

    const sortedVersions = Object.keys(proofVersions).sort((a, b) => parseInt(a) - parseInt(b))
    for (let i = 1; i <= sortedVersions.length; i++) {
      const { bytes, isOperator } = proofVersions[sortedVersions[i - 1]]
      const preimage = bytes.substring(
        isOperator ? 222 : 164,
        isOperator ? 286 : 228
      )
      const proof = bytes.substring(
        isOperator ? 294 : 236,
        isOperator ? 3066 : 3008
      )
      const proofJson = {
        height: i,
        preimage,
        proof,
        elapsed_secs: 2000,
        difficulty: 120000000,
        security: 512
      }
      archive.append(JSON.stringify(proofJson), {
        name: `proof_${i}.json`,
      })
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
          const proofJson = {
            height,
            preimage,
            proof,
            elapsed_secs: 2000,
            difficulty: 120000000,
            security: 512,
          }
          archive.append(JSON.stringify(proofJson), {
            name: `proof_${height}.json`,
          })
        }

        return true
    })
    if (!allAccountTransactionsRes) {
      ctx.status = 500
      ctx.body = 'Error iterating through all miner account transactions'
      return
    }
  }

  ctx.type = 'application/zip'
  ctx.body = archive
  ctx.response.attachment(
    `vdf_proofs_${address}_${Math.floor(Date.now() / 1000)}.zip`
  )

  archive.finalize()
})

module.exports = router
