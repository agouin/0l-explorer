import API from './index'
import getTypescriptAPI from '../types/api'
import {
  AccountResponse,
  TransactionsResponse,
  CurrenciesResponse,
  TransactionResponse,
  MetadataResponse,
  TowerStateResponse,
  EventsResponse,
} from '../types/0l'
import { AxiosResponse } from 'axios'
const { NODE_HOSTNAME } = process.env

export const NodeAPI = getTypescriptAPI(
  new API(`http://${NODE_HOSTNAME}:8080`, {
    'Content-Type': 'application/json',
  })
)

const CallRPC = (method: string, params: any[]) =>
  NodeAPI.POST('', { method, jsonrpc: '2.0', id: 1, params })

export const getTransactions = (body: {
  startVersion: number
  limit: number
  includeEvents: boolean
}): Promise<AxiosResponse<TransactionsResponse>> =>
  CallRPC('get_transactions', [
    body.startVersion,
    body.limit,
    body.includeEvents,
  ])
export const getTransaction = (body: {
  hash: string
  includeEvents: boolean
}): Promise<AxiosResponse<TransactionResponse>> =>
  CallRPC('get_transaction', [body.hash, body.includeEvents])
export const getAccount = (body: {
  account: string
}): Promise<AxiosResponse<AccountResponse>> =>
  CallRPC('get_account', [body.account])
export const getAccountTransaction = (body: {
  account: string
  sequenceNumber: number
  includeEvents: boolean
}) =>
  CallRPC('get_account_transaction', [
    body.account,
    body.sequenceNumber,
    body.includeEvents,
  ])
export const getAccountTransactions = (body: {
  account: string
  start: number
  limit: number
  includeEvents: boolean
}): Promise<AxiosResponse<TransactionsResponse>> =>
  CallRPC('get_account_transactions', [
    body.account,
    body.start,
    body.limit,
    body.includeEvents,
  ])
export const getMetadata = (body: {
  version?: number
}): Promise<AxiosResponse<MetadataResponse>> =>
  CallRPC('get_metadata', body.version === undefined ? [] : [body.version])
export const getEvents = (body: {
  key: string
  start: number
  limit: number
}): Promise<AxiosResponse<EventsResponse>> =>
  CallRPC('get_events', [body.key, body.start, body.limit])
export const getCurrencies = (): Promise<AxiosResponse<CurrenciesResponse>> =>
  CallRPC('get_currencies', [])

export const getTowerState = (body: {
  account: string
}): Promise<AxiosResponse<TowerStateResponse>> =>
  CallRPC('get_tower_state_view', [body.account])

export default CallRPC
