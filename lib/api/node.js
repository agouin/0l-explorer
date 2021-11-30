const API = require('./index')

const { NODE_HOSTNAME } = process.env

const NodeAPI = new API(`http://${NODE_HOSTNAME}:8080`, {
  'Content-Type': 'application/json',
})

const CallRPC = (method, params) =>
  NodeAPI.POST('', { method, jsonrpc: '2.0', id: 1, params })

const getTransactions = ({ startVersion, limit, includeEvents }) =>
  CallRPC('get_transactions', [startVersion, limit, includeEvents])

const getTransaction = ({ hash, includeEvents }) =>
  CallRPC('get_transaction', [hash, includeEvents])

const getAccount = ({ account }) => CallRPC('get_account', [account])

const getAccountTransaction = ({ account, sequenceNumber, includeEvents }) =>
  CallRPC('get_account_transaction', [account, sequenceNumber, includeEvents])

const getAccountTransactions = ({ account, start, limit, includeEvents }) =>
  CallRPC('get_account_transactions', [account, start, limit, includeEvents])

const getMetadata = ({ version }) =>
  CallRPC('get_metadata', version === undefined ? [] : [version])

const getEvents = ({ key, start, limit }) =>
  CallRPC('get_events', [key, start, limit])

const getCurrencies = () => CallRPC('get_currencies', [])

const getTowerState = ({ account }) =>
  CallRPC('get_tower_state_view', [account])

module.exports = {
  getTransactions,
  getTransaction,
  getAccount,
  getAccountTransaction,
  getAccountTransactions,
  getMetadata,
  getEvents,
  getCurrencies,
  getTowerState,
}
