import { message, Tooltip, Row, Col } from 'antd'
import { GetServerSideProps } from 'next'
import { useEffect } from 'react'
import classes from './address.module.scss'
import {
  getAccount,
  getAccountTransactions,
  getTowerState,
  getEvents,
  getTransactions,
} from '../../lib/api/node'
import NavLayout from '../../components/navLayout/navLayout'
import { AxiosResponse } from 'axios'
import {
  Account,
  AccountResponse,
  TransactionsResponse,
  TransactionMin,
  getTransactionMin,
  NodeRPCError,
  TowerStateResponse,
  TowerState,
  EventsResponse,
  ValidatorPermissionTreeResponse,
  MinerPermissionTreeResponse,
  Event,
} from '../../lib/types/0l'
import { get } from 'lodash'
import TransactionsTable from '../../components/transactionsTable/transactionsTable'
import { numberWithCommas } from '../../lib/utils'
import NotFoundPage from '../404'
import {
  getValidatorPermissionTree,
  getMinerPermissionTree,
} from '../../lib/api/permissionTree'
import EventsTable from '../../components/eventsTable/eventsTable'

const fallbackCopyTextToClipboard = (text) => {
  var textArea = document.createElement('textarea')
  textArea.value = text

  // Avoid scrolling to bottom
  textArea.style.top = '0'
  textArea.style.left = '0'
  textArea.style.position = 'fixed'

  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()

  try {
    var successful = document.execCommand('copy')
    var msg = successful ? 'successful' : 'unsuccessful'
    console.log('Fallback: Copying text command was ' + msg)
    message.success('Copied to clipboard')
  } catch (err) {
    message.error('Error copying to clipboard')
    console.error('Fallback: Oops, unable to copy', err)
  }

  document.body.removeChild(textArea)
}

const copyTextToClipboard = async (text) => {
  if (!navigator.clipboard) {
    fallbackCopyTextToClipboard(text)
    return
  }
  try {
    await navigator.clipboard.writeText(text)
    console.log('Async: Copying to clipboard was successful!')
    message.success('Copied to clipboard')
  } catch (err) {
    message.error('Error copying to clipboard')
    console.error('Async: Could not copy text: ', err)
  }
}

interface AddressPageProps {
  account: Account
  transactions: TransactionMin[]
  events: Event[]
  onboardedBy: string
  validatorAccountCreatedBy: string
  towerState: TowerState
  errors: NodeRPCError[]
}

const AddressPage = ({
  account,
  transactions,
  events,
  onboardedBy,
  validatorAccountCreatedBy,
  towerState,
  errors,
}: AddressPageProps) => {
  if (!account) return NotFoundPage()

  useEffect(() => {
    if (errors.length > 0) {
      console.error(errors)
      for (const error of errors) {
        message.error(`${error.message} (${error.code})`)
      }
    }
  }, [])

  const balance = (get(account, 'balances[0].amount') || 0) / 1000000
  return (
    <NavLayout>
      <div className={classes.topStats}>
        <div className={classes.topStatsInner}>
          <h1
            className={classes.address}
            onClick={copyTextToClipboard.bind(this, account.address)}>
            Address:{' '}
            <span className={classes.addressText}>{account.address}</span>
          </h1>
          <h3
            className={classes.balance}
            onClick={copyTextToClipboard.bind(this, balance)}>
            Balance:{' '}
            <span className={classes.balanceText}>
              {numberWithCommas(balance)}
            </span>
          </h3>
          {onboardedBy && (
            <h1 className={classes.onboardedBy}>
              Onboarded by:{' '}
              {onboardedBy === 'Genesis' ? (
                <span className={classes.addressText}>Genesis</span>
              ) : (
                <a href={`/address/${onboardedBy}`}>
                  <span className={classes.addressText}>{onboardedBy}</span>
                </a>
              )}
            </h1>
          )}
          {validatorAccountCreatedBy && (
            <h1 className={classes.onboardedBy}>
              Created by Validator:{' '}
              {onboardedBy === '00000000000000000000000000000000' ? (
                <span className={classes.addressText}>Genesis</span>
              ) : (
                <a href={`/address/${validatorAccountCreatedBy}`}>
                  <span className={classes.addressText}>
                    {validatorAccountCreatedBy}
                  </span>
                </a>
              )}
            </h1>
          )}
          {towerState && (
            <>
              <div className={classes.infoRow}>
                <Tooltip title="Total proofs submitted (excluding genesis proof)">
                  <span className={classes.infoText}>
                    Tower Height:{' '}
                    <span className={classes.thinText}>
                      {towerState.verified_tower_height}
                    </span>
                  </span>
                </Tooltip>
                <Tooltip title="Latest epoch in which a proof was submitted">
                  <span className={classes.infoText}>
                    Last Epoch Mined:{' '}
                    <span className={classes.thinText}>
                      {towerState.latest_epoch_mining}
                    </span>
                  </span>
                </Tooltip>
                <Tooltip title="Total proofs in current epoch">
                  <span className={classes.infoText}>
                    Proofs in Epoch:{' '}
                    <span className={classes.thinText}>
                      {towerState.count_proofs_in_epoch}
                    </span>
                  </span>
                </Tooltip>
              </div>
              <div className={classes.infoRow}>
                <Tooltip title="Total epochs since first proof">
                  <span className={classes.infoText}>
                    Epochs Mining:{' '}
                    <span className={classes.thinText}>
                      {towerState.epochs_validating_and_mining}
                    </span>
                  </span>
                </Tooltip>
                <Tooltip title="Number of epochs mining in a row without missing proofs">
                  <span className={classes.infoText}>
                    Contiguous Epochs Mining:{' '}
                    <span className={classes.thinText}>
                      {towerState.contiguous_epochs_validating_and_mining}
                    </span>
                  </span>
                </Tooltip>
                <Tooltip title="Epochs that have elapsed since the last account creation (either this account's creation or another validator's account if this account is a validator that created another validator account)">
                  <span className={classes.infoText}>
                    Epochs Since Last Account Creation:{' '}
                    <span className={classes.thinText}>
                      {towerState.epochs_since_last_account_creation}
                    </span>
                  </span>
                </Tooltip>
              </div>
            </>
          )}
        </div>
      </div>
      <Row>
        <Col xs={24} sm={24} md={24} lg={13}>
          <TransactionsTable
            transactions={transactions}
            pagination={{ pageSize: 20 }}
            top={
              <div>
                <div className={classes.outerHeader}>
                  <div className={classes.header}>
                    <span className={classes.title}>Blocks</span>
                  </div>
                  <div></div>
                </div>
              </div>
            }
          />
        </Col>
        <Col xs={24} sm={24} md={24} lg={11}>
          <EventsTable
            top={
              <div>
                <div className={classes.outerHeader}>
                  <div className={classes.header}>
                    <span className={classes.title}>Events</span>
                  </div>
                  <div></div>
                </div>
              </div>
            }
            events={events}
          />
        </Col>
      </Row>
    </NavLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { address } = ctx.params
  console.log('Fetching account', address)
  const addressSingle = Array.isArray(address) ? address[0] : address
  const eventsKey = `0000000000000000${addressSingle}`
  const [
    { data: accountsRes, status: accountsStatus },
    { data: transactionsRes, status: transactionsStatus },
    { data: towerRes, status: towerStatus },
    { data: eventsRes, status: eventsStatus },
  ]: [
    AxiosResponse<AccountResponse>,
    AxiosResponse<TransactionsResponse>,
    AxiosResponse<TowerStateResponse>,
    AxiosResponse<EventsResponse>
  ] = await Promise.all([
    getAccount({ account: addressSingle }),
    getAccountTransactions({
      account: addressSingle,
      start: 0,
      limit: 1000,
      includeEvents: false,
    }),
    getTowerState({ account: addressSingle }),
    getEvents({ key: eventsKey, start: 0, limit: 1000 }),
  ])

  const errors = []
  if (accountsRes.error) errors.push(accountsRes.error)
  if (transactionsRes.error) errors.push(transactionsRes.error)
  if (towerRes.error) errors.push(towerRes.error)
  if (eventsRes.error) errors.push(eventsRes.error)

  const nonZeroEvents = eventsRes.result
    .slice(0, 20)
    .filter((event) => event.data.sender !== '00000000000000000000000000000000')

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
    events.unshift(
      ...nextSetOfEventsRes.data.result.sort(
        (a, b) => b.transaction_version - a.transaction_version
      )
    )
    eventsCount = nextSetOfEventsRes.data.result.length
    start += eventsCount
  }

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
    validatorAccountCreatedBy = null

  for (const transaction of nonZeroEventTransactionsRes) {
    const sender = get(transaction, 'data.result[0].transaction.sender')
    const functionName = get(
      transaction,
      'data.result[0].transaction.script.function_name'
    )
    if (functionName === 'create_acc_val') validatorAccountCreatedBy = sender
    else if (functionName === 'create_user_by_coin_tx') onboardedBy = sender
  }

  if (!onboardedBy && !validatorAccountCreatedBy) onboardedBy = 'Genesis'

  if (!accountsRes.result) ctx.res.statusCode = 404

  const transactions: TransactionMin[] = []
  let transactionsCount = 0
  if (transactionsStatus === 200 && !transactionsRes.error) {
    transactions.unshift(
      ...transactionsRes.result
        .sort((a, b) => b.version - a.version)
        .map((tx) => getTransactionMin(tx))
    )
    transactionsCount = transactionsRes.result.length
  }

  let startTx = transactionsCount

  while (transactionsCount === 1000) {
    const nextSetOfTransactionsRes = await getAccountTransactions({
      account: addressSingle,
      start: startTx,
      limit: 1000,
      includeEvents: false,
    })
    if (
      nextSetOfTransactionsRes.status !== 200 ||
      nextSetOfTransactionsRes.data.error
    )
      break
    transactions.unshift(
      ...nextSetOfTransactionsRes.data.result
        .sort((a, b) => b.version - a.version)
        .map((tx) => getTransactionMin(tx))
    )
    eventsCount = nextSetOfTransactionsRes.data.result.length
    startTx += eventsCount
  }

  const account: Account = accountsRes.result || null
  const towerState: TowerState = towerRes.result || null

  return {
    props: {
      account,
      transactions,
      onboardedBy,
      validatorAccountCreatedBy,
      events,
      towerState,
      errors,
    },
  }
}

export default AddressPage
