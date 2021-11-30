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
import {
  getTransactions as getTransactionsJS,
  getTransaction as getTransactionJS,
  getAccount as getAccountJS,
  getAccountTransaction as getAccountTransactionJS,
  getAccountTransactions as getAccountTransactionsJS,
  getMetadata as getMetadataJS,
  getEvents as getEventsJS,
  getCurrencies as getCurrenciesJS,
  getTowerState as getTowerStateJS,
} from './node.js'

export const getTransactions = (body: {
  startVersion: number
  limit: number
  includeEvents: boolean
}): Promise<AxiosResponse<TransactionsResponse>> => getTransactionsJS(body)

export const getTransaction = (body: {
  hash: string
  includeEvents: boolean
}): Promise<AxiosResponse<TransactionResponse>> => getTransactionJS(body)

export const getAccount = (body: {
  account: string
}): Promise<AxiosResponse<AccountResponse>> => getAccountJS(body)

export const getAccountTransaction = (body: {
  account: string
  sequenceNumber: number
  includeEvents: boolean
}) => getAccountTransactionJS(body)

export const getAccountTransactions = (body: {
  account: string
  start: number
  limit: number
  includeEvents: boolean
}): Promise<AxiosResponse<TransactionsResponse>> =>
  getAccountTransactionsJS(body)

export const getMetadata = (body: {
  version?: number
}): Promise<AxiosResponse<MetadataResponse>> => getMetadataJS(body)

export const getEvents = (body: {
  key: string
  start: number
  limit: number
}): Promise<AxiosResponse<EventsResponse>> => getEventsJS(body)

export const getCurrencies = (): Promise<AxiosResponse<CurrenciesResponse>> =>
  getCurrenciesJS()

export const getTowerState = (body: {
  account: string
}): Promise<AxiosResponse<TowerStateResponse>> => getTowerStateJS(body)
