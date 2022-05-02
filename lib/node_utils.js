const { get } = require('lodash')
const { capitalCase } = require('change-case')

const getTransactionMin = (tx) => {
  const script_function = get(tx, 'transaction.script.function_name')
  const status = get(tx, 'vm_status.type')

  const expiration = get(tx, 'transaction.expiration_timestamp_secs')
  const timestamp = expiration
    ? script_function === 'autopay_create_instruction'
      ? (expiration - 510443) * 1000000
      : (expiration - 4999) * 1000000
    : undefined

  const { version, hash } = tx
  const sender = get(tx, 'transaction.sender') || null
  if (script_function === 'create_user_by_coin_tx') {
    const onboard_address = get(tx, 'transaction.script.arguments_bcs[0]')
    if (onboard_address) {
      return {
        type: 'Onboard',
        recipient: onboard_address,
        status,
        sender,
        timestamp,
        version,
        hash,
      }
    }
  } else if (
    script_function === 'minerstate_commit' ||
    script_function === 'minerstate_commit_by_operator'
  ) {
    return {
      type: 'Miner Proof',
      status,
      sender,
      version,
      timestamp,
      hash,
    }
  }
  let type = tx.transaction.type
  if (type === 'blockmetadata') {
    type = 'Block Metadata'
    return {
      type,
      timestamp: tx.transaction.timestamp_usecs,
      hash,
      sender,
      version,
      status,
    }
  }
  return {
    type: capitalCase(type),
    hash,
    sender,
    version,
    timestamp,
    status,
  }
}

module.exports = {
  getTransactionMin,
}
