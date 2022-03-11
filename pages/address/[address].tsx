import { message, Row, Col, Button, Table } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import { GetServerSideProps } from 'next'
import { useEffect, useState } from 'react'
import classes from './address.module.scss'
import {
  getAccount,
  getAccountTransactions,
  getTowerState,
  getEvents,
  getTransactions,
} from '../../lib/api/node'
import NavLayout from '../../components/navLayout/navLayout'
import {
  Account,
  TransactionMin,
  getTransactionMin,
  NodeRPCError,
  TowerState,
  Event,
  MinerEpochStatsResponse,
  ValidatorInfo,
} from '../../lib/types/0l'
import { get } from 'lodash'
import TransactionsTable from '../../components/transactionsTable/transactionsTable'
import { getVitals, numberWithCommas } from '../../lib/utils'
import NotFoundPage from '../404'
import {
  getMinerProofHistory,
  getValidatorPermissionTree,
  getMinerPermissionTree,
  getEpochsStats,
} from '../../lib/api/permissionTree'

import EventsTable from '../../components/eventsTable/eventsTable'
import { pageview, event } from '../../lib/gtag'
import CommunityWallets from '../../lib/communityWallets'
import QRCode from 'react-qr-code'

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
  operatorAccount: string
  validatorAccountCreatedBy: string
  towerState: TowerState
  proofHistory: MinerEpochStatsResponse[]
  type: string
  validatorAutoPayStats: ValidatorInfo
  errors: NodeRPCError[]
  minerEpochOnboarded?: number
  minerGeneration?: number
  validatorEpochOnboarded?: number
  validatorGeneration?: number
}

const AddressPage = ({
  account,
  transactions,
  events,
  onboardedBy,
  operatorAccount,
  validatorAccountCreatedBy,
  towerState,
  proofHistory,
  type,
  validatorAutoPayStats,
  errors,
  minerEpochOnboarded,
  minerGeneration,
  validatorEpochOnboarded,
  validatorGeneration,
}: AddressPageProps) => {
  if (!account) return NotFoundPage()

  const [pageSize, setPageSize] = useState(20)

  useEffect(() => {
    pageview('/address', 'address')
    if (errors.length > 0) {
      console.error(errors)
      for (const error of errors) {
        message.error(`${error.message} (${error.code})`)
      }
    }
  }, [])

  const trackDownloadProofs = () => {
    event({
      category: 'addressPage',
      action: 'downloadProofs',
      label: account.address,
      value: null,
    })
  }

  const onPaginationChange = (newPage, newPageSize) => {
    setPageSize(newPageSize)
  }

  const balance = (get(account, 'balances[0].amount') || 0) / 1000000
  return (
    <NavLayout>
      <div className={classes.topContainer}>
        <div className={classes.topStats}>
          <div className={classes.topStatsInner}>
            <h1
              className={classes.address}
              onClick={copyTextToClipboard.bind(this, account.address)}>
              Address:{' '}
              <span className={classes.addressText}>{account.address}</span>
            </h1>
            <div className={classes.qrContainer}>
              <div>
                <h3
                  className={classes.balance}
                  onClick={copyTextToClipboard.bind(this, balance)}>
                  Balance:{' '}
                  <span className={classes.balanceText}>
                    {numberWithCommas(balance)}
                  </span>
                </h3>

                {type && (
                  <h1 className={classes.onboardedBy}>
                    Type: <span className={classes.addressText}>{type}</span>
                  </h1>
                )}
                {type === 'Validator' && (
                  <h1 className={classes.onboardedBy}>
                    In Active Validator Set:{' '}
                    <span className={classes.addressText}>
                      {validatorAutoPayStats ? 'Yes' : 'No'}
                    </span>
                  </h1>
                )}
                {type === 'Community Wallet' && (
                  <>
                    <h1 className={classes.onboardedBy}>
                      Name:{' '}
                      <a
                        href={CommunityWallets[account.address].link}
                        target="_blank">
                        <span className={classes.addressText}>
                          {CommunityWallets[account.address].text}
                        </span>
                      </a>
                    </h1>
                  </>
                )}
                {validatorAutoPayStats && (
                  <>
                    <h1 className={classes.onboardedBy}>
                      Votes in Epoch:{' '}
                      <span className={classes.addressText}>
                        {validatorAutoPayStats.vote_count_in_epoch}
                      </span>
                    </h1>
                    <h1 className={classes.onboardedBy}>
                      Props In Epoch:{' '}
                      <span className={classes.addressText}>
                        {validatorAutoPayStats.prop_count_in_epoch}
                      </span>
                    </h1>
                    {/* <h1 className={classes.onboardedBy}>
                  Full Node IP:{' '}
                  <span className={classes.addressText}>
                    {validatorAutoPayStats.full_node_ip}
                  </span>
                </h1> */}
                  </>
                )}
                {validatorEpochOnboarded !== null && (
                  <h1 className={classes.onboardedBy}>
                    {'Validator Epoch Onboarded: '}
                    <span className={classes.addressText}>
                      {validatorEpochOnboarded}
                    </span>
                  </h1>
                )}
                {validatorGeneration !== null && (
                  <h1 className={classes.onboardedBy}>
                    {'Validator Generation: '}
                    <span className={classes.addressText}>
                      {validatorGeneration}
                    </span>
                  </h1>
                )}
                {minerEpochOnboarded !== null &&
                  validatorEpochOnboarded !== minerEpochOnboarded && (
                    <h1 className={classes.onboardedBy}>
                      {'Epoch Onboarded: '}
                      <span className={classes.addressText}>
                        {minerEpochOnboarded}
                      </span>
                    </h1>
                  )}
                {minerGeneration !== null &&
                  minerGeneration !== validatorGeneration && (
                    <h1 className={classes.onboardedBy}>
                      {'Generation: '}
                      <span className={classes.addressText}>
                        {minerGeneration}
                      </span>
                    </h1>
                  )}
              </div>
              <div className={classes.qrCode}>
                <QRCode
                  size={100}
                  fgColor="#fff"
                  bgColor="#003f34"
                  value={`https://0lexplorer.io/address/${account.address}`}
                />
              </div>
            </div>

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
            {validatorAccountCreatedBy &&
              validatorAccountCreatedBy !==
                '00000000000000000000000000000000' &&
              towerState && (
                <h1 className={classes.onboardedBy}>
                  Created by Validator:{' '}
                  <a href={`/address/${validatorAccountCreatedBy}`}>
                    <span className={classes.addressText}>
                      {validatorAccountCreatedBy}
                    </span>
                  </a>
                </h1>
              )}
            {operatorAccount && (
              <h1 className={classes.onboardedBy}>
                {towerState ? 'Operator' : 'Validator'}
                {' Account: '}
                <a href={`/address/${operatorAccount}`}>
                  <span className={classes.addressText}>{operatorAccount}</span>
                </a>
              </h1>
            )}
          </div>
        </div>
        {towerState && (
          <div className={classes.statsTablesContainer}>
            <div className={classes.proofHistoryTable}>
              <div className={classes.proofHistoryTitle}>
                <h3 className={classes.proofHistoryLabel}>Tower Stats</h3>
                <a href={`/api/proofs/${account.address}`} target="_blank">
                  <Button
                    className={classes.downloadProofsButton}
                    type="primary"
                    onClick={trackDownloadProofs}>
                    <DownloadOutlined />
                    VDF Proofs
                  </Button>
                </a>
              </div>
              <Table
                size="small"
                rowKey="epoch"
                columns={[
                  { title: 'Stat', dataIndex: 'stat' },
                  { title: 'Value', dataIndex: 'value' },
                ]}
                dataSource={[
                  {
                    stat: 'Tower Height',
                    value: towerState.verified_tower_height,
                  },
                  {
                    stat: 'Proofs in Epoch',
                    value: towerState.actual_count_proofs_in_epoch,
                  },
                  {
                    stat: 'Last Epoch Mined',
                    value: towerState.latest_epoch_mining,
                  },
                  {
                    stat: 'Epochs Mining',
                    value: towerState.epochs_validating_and_mining,
                  },
                  {
                    stat: 'Contiguous Epochs Mining',
                    value: towerState.contiguous_epochs_validating_and_mining,
                  },
                  {
                    stat: 'Epochs Since Last Account Creation',
                    value: towerState.epochs_since_last_account_creation,
                  },
                ]}
                pagination={false}
              />
            </div>
            {proofHistory && (
              <div className={classes.proofHistoryTable}>
                <div className={classes.proofHistoryTitle}>
                  <h3 className={classes.proofHistoryLabel}>Miner History</h3>{' '}
                </div>
                <Table
                  size="small"
                  rowKey="epoch"
                  columns={[
                    { title: 'Epoch', dataIndex: 'epoch' },
                    { title: 'Proofs Submitted', dataIndex: 'count' },
                  ]}
                  dataSource={proofHistory}
                  pagination={{
                    pageSize: 5,
                    showSizeChanger: false,
                    showQuickJumper: false,
                    showPrevNextJumpers: true,
                  }}
                />
              </div>
            )}
          </div>
        )}
        {validatorAutoPayStats && (
          <div className={classes.proofHistoryTable}>
            <div className={classes.proofHistoryTitle}>
              <h3 className={classes.proofHistoryLabel}>
                Auto Pay Instructions
              </h3>{' '}
            </div>
            <h1 className={classes.onboardedBy}>
              Total Recurring:{' '}
              <span className={classes.addressText}>
                {(validatorAutoPayStats.autopay.recurring_sum / 100).toFixed(2)}
                %
              </span>
            </h1>
            <Table
              size="small"
              rowKey="payee"
              columns={[
                {
                  title: 'Community Wallet',
                  dataIndex: 'payee',
                  render: (address) => (
                    <a href={`/address/${address}`}>{address}</a>
                  ),
                },
                { title: 'Amount', dataIndex: 'amount' },
                { title: 'End Epoch', dataIndex: 'end_epoch' },
              ]}
              dataSource={validatorAutoPayStats.autopay.payments}
              pagination={{
                pageSize: 5,
                showSizeChanger: false,
                showQuickJumper: false,
                showPrevNextJumpers: true,
              }}
            />
          </div>
        )}
      </div>
      <Row>
        <Col xs={24} sm={24} md={24} lg={13}>
          <TransactionsTable
            transactions={transactions}
            pagination={{ pageSize, onChange: onPaginationChange }}
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
  const lowercaseAddress = addressSingle.toLowerCase()
  const eventsKey = `0000000000000000${addressSingle}`
  const [
    { data: accountsRes, status: accountsStatus },
    { data: transactionsRes, status: transactionsStatus },
    { data: towerRes, status: towerStatus },
    { data: eventsRes, status: eventsStatus },
    { data: proofHistoryRes, status: proofHistoryStatus },
    { data: validatorPermissionTreeRes, status: validatorPermissionTreeStatus },
    { data: minerPermissionTreeRes, status: minerPermissionTreeStatus },
  ] = await Promise.all([
    getAccount({ account: addressSingle }),
    getAccountTransactions({
      account: addressSingle,
      start: 0,
      limit: 1000,
      includeEvents: true,
    }),
    getTowerState({ account: addressSingle }),
    getEvents({ key: eventsKey, start: 0, limit: 1000 }),
    getMinerProofHistory(lowercaseAddress),
    getValidatorPermissionTree(lowercaseAddress),
    getMinerPermissionTree(lowercaseAddress),
  ])

  const errors = []
  if (accountsRes.error) errors.push(accountsRes.error)
  if (transactionsRes.error) errors.push(transactionsRes.error)
  //if (towerRes.error) errors.push(towerRes.error)
  if (eventsRes.error) errors.push(eventsRes.error)

  const nonZeroEvents = eventsRes.result.filter(
    (event) => event.data.sender !== '00000000000000000000000000000000'
  )

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

  let onboardedBy = null,
    validatorAccountCreatedBy = null,
    operatorAccount = null,
    minerEpochOnboarded = null,
    minerGeneration = null,
    validatorEpochOnboarded = null,
    validatorGeneration = null

  if (minerPermissionTreeStatus === 200 && minerPermissionTreeRes) {
    if (
      validatorPermissionTreeStatus === 404 ||
      !validatorPermissionTreeRes ||
      validatorPermissionTreeRes.parent !== minerPermissionTreeRes.parent
    )
      onboardedBy =
        minerPermissionTreeRes.parent === '00000000000000000000000000000000'
          ? 'Genesis'
          : minerPermissionTreeRes.parent
    if (minerPermissionTreeRes.epoch_onboarded !== undefined)
      minerEpochOnboarded = minerPermissionTreeRes.epoch_onboarded
    if (minerPermissionTreeRes.generation !== undefined)
      minerGeneration = minerPermissionTreeRes.generation
  }

  if (validatorPermissionTreeStatus === 200 && validatorPermissionTreeRes) {
    validatorAccountCreatedBy = validatorPermissionTreeRes.parent
    if (validatorAccountCreatedBy === '00000000000000000000000000000000')
      onboardedBy = 'Genesis'
    if (validatorPermissionTreeRes.operator_address !== undefined)
      operatorAccount = validatorPermissionTreeRes.operator_address
    if (validatorPermissionTreeRes.epoch_onboarded !== undefined)
      validatorEpochOnboarded = validatorPermissionTreeRes.epoch_onboarded
    if (validatorPermissionTreeRes.generation !== undefined)
      validatorGeneration = validatorPermissionTreeRes.generation
  }

  if (
    minerPermissionTreeStatus === 404 ||
    validatorPermissionTreeStatus === 404
  ) {
    const nonZeroEventTransactionsRes = await Promise.all(
      nonZeroEvents.map((event) =>
        getTransactions({
          startVersion: event.transaction_version,
          limit: 1,
          includeEvents: true,
        })
      )
    )

    for (const transaction of nonZeroEventTransactionsRes) {
      const sender = get(transaction, 'data.result[0].transaction.sender')
      const functionName = get(
        transaction,
        'data.result[0].transaction.script.function_name'
      )
      if (functionName === 'create_acc_val') {
        const events = get(transaction, 'data.result[0].events')
        if (events && events.length > 0) {
          const operatorCreateEvent = events.find(
            (event) =>
              get(event, 'data.type') === 'receivedpayment' &&
              get(event, 'data.receiver') !== lowercaseAddress
          )
          if (operatorCreateEvent) {
            operatorAccount = get(operatorCreateEvent, 'data.receiver') || null
          }
        }
        validatorAccountCreatedBy = sender
      } else if (functionName === 'create_user_by_coin_tx') onboardedBy = sender
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
        const operatorCreateEvent = genesisEvents.find(
          (event) => get(event, 'data.sender') === lowercaseAddress
        )
        if (operatorCreateEvent)
          validatorAccountCreatedBy = '00000000000000000000000000000000'
        operatorAccount = get(operatorCreateEvent, 'data.receiver') || null
      }
    }
  } else {
    console.log('got everything we need from permission tree API')
  }

  if (!accountsRes.result) ctx.res.statusCode = 404

  let proofs: MinerEpochStatsResponse[] = []

  if (operatorAccount) {
    const operatorProofsRes = await getMinerProofHistory(
      operatorAccount.toLowerCase()
    )
    if (operatorProofsRes.status === 200 && operatorProofsRes.data) {
      if (!proofHistoryRes) proofs = operatorProofsRes.data
      else {
        proofs = proofHistoryRes
        for (const proof of operatorProofsRes.data) {
          let index = proofs.findIndex(
            (proofHistory) => proofHistory.epoch === proof.epoch
          )
          if (index !== -1) proofs[index].count += proof.count
          else proofs.push(proof)
        }
        proofs.sort((a, b) => b.epoch - a.epoch)
      }
    }
  } else if (proofHistoryRes) {
    proofs = proofHistoryRes
  }

  const transactions: TransactionMin[] = []
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
      account: addressSingle,
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

  const account: Account = accountsRes.result || null
  const towerState: TowerState = towerRes.result || null

  const type = validatorAccountCreatedBy
    ? towerState
      ? 'Validator'
      : 'Operator'
    : towerState
    ? 'Miner'
    : Object.keys(CommunityWallets).indexOf(lowercaseAddress) !== -1
    ? 'Community Wallet'
    : ''

  let validatorAutoPayStats: ValidatorInfo = null
  if (type === 'Validator') {
    const vitals = await getVitals()
    validatorAutoPayStats =
      vitals.chain_view.validator_view.find(
        (validator) =>
          validator.account_address.toLowerCase() === lowercaseAddress
      ) || null

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
                    get(event, 'data.sender', '').toLowerCase() ===
                      lowercaseAddress
                )
              )
            }
          }
        }
      }
    }
  }

  return {
    props: {
      account,
      transactions,
      onboardedBy,
      operatorAccount,
      validatorAccountCreatedBy,
      proofHistory:
        towerState && towerState.actual_count_proofs_in_epoch > 0
          ? proofs.filter(
              (proof) => proof.epoch != towerState.latest_epoch_mining
            )
          : proofs,
      events: events.sort(
        (a, b) => b.transaction_version - a.transaction_version
      ),
      towerState,
      type,
      validatorAutoPayStats,
      minerEpochOnboarded,
      minerGeneration,
      validatorEpochOnboarded,
      validatorGeneration,
      errors,
    },
  }
}

export default AddressPage
