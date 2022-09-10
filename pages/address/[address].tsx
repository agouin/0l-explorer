import { message, Row, Col, Button, Table, Checkbox } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import { GetServerSideProps } from 'next'
import { useEffect, useRef, useState } from 'react'
import classes from './address.module.scss'
import {
  getAccount,
  getTowerState,
  getEvents,
  getTransactions,
} from '../../lib/api/node'
import NavLayout from '../../components/navLayout/navLayout'
import {
  Account,
  TransactionMin,
  NodeRPCError,
  TowerState,
  Event,
  MinerEpochStatsResponse,
  ValidatorInfo,
} from '../../lib/types/0l'
import { get, cloneDeep } from 'lodash'
import TransactionsTable from '../../components/transactionsTable/transactionsTable'
import { numberWithCommas } from '../../lib/utils'
import NotFoundPage from '../404'
import {
  getMinerProofHistory,
  getValidatorPermissionTree,
  getMinerPermissionTree,
} from '../../lib/api/permissionTree'

import EventsTable, { EventTypes } from '../../components/eventsTable/eventsTable'
import { pageview, event } from '../../lib/gtag'
import CommunityWallets from '../../lib/communityWallets'
import QRCode from 'react-qr-code'
import API from '../../lib/api/local'
import communityWallets from '../../lib/communityWallets'
import { getTransactionMin } from '../../lib/node_utils'
import { CheckboxChangeEvent } from 'antd/lib/checkbox'

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
  towerState: TowerState
  errors: NodeRPCError[]
}

const AddressPage = ({ account, towerState, errors }: AddressPageProps) => {
  if (!account) return NotFoundPage()

  const [pageSize, setPageSize] = useState(20)

  const unfilteredBlocks = useRef<TransactionMin[]>([])
  const [blockFilters, setBlockFilters] = useState<string[]>([])
  const [blockFiltersChecked, setBlockFiltersChecked] = useState<{}>([])

  const unfilteredEvents = useRef<Event[]>([])
  const [eventFilters, setEventFilters] = useState<string[]>([])
  const [eventFiltersChecked, setEventFiltersChecked] = useState<{}>([])

  const [transactions, setTransactions] = useState<TransactionMin[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [transactionsLoading, setTransactionsLoading] = useState<boolean>(true)
  const [eventsLoading, setEventsLoading] = useState<boolean>(true)
  const [onboardedBy, setOnboardedBy] = useState<string>('')
  const [operatorAccount, setOperatorAccount] = useState<string>('')
  const [validatorAccountCreatedBy, setValidatorAccountCreatedBy] =
    useState<string>('')
  const [proofHistory, setProofHistory] = useState<MinerEpochStatsResponse[]>(
    []
  )
  const [type, setType] = useState<string>('')
  const [validatorAutoPayStats, setValidatorAutoPayStats] =
    useState<ValidatorInfo>(null)
  const [minerEpochOnboarded, setMinerEpochOnboarded] = useState<number>(null)
  const [minerGeneration, setMinerGeneration] = useState<number>(null)
  const [validatorEpochOnboarded, setValidatorEpochOnboarded] =
    useState<number>(null)
  const [validatorGeneration, setValidatorGeneration] = useState<number>(null)

  const getTransactionsAndEvents = async (type: string, address: string, operatorAccount: string) => {
    const chunkSize = 1000
    let txLength = chunkSize,
      evtLength = chunkSize
    let currentTx = 0,
      currentEvt = 0
    const newTxs = []
    const newEvts = []
    const newEventFilters = []
    const addEventFilter = (eventType) => {
      if (newEventFilters.indexOf(eventType) >= 0) return
      newEventFilters.push(eventType)
    }
    const newBlockFilters = []
    const addBlockFilter = (type) => {
      if (newBlockFilters.indexOf(type) >= 0) return
      newBlockFilters.push(type)
    }
    while (txLength === chunkSize || evtLength == chunkSize) {
      const promises = []
      if (txLength === chunkSize) {
        const params = { type, address, start: currentTx, limit: chunkSize }
        console.log({ params })
        promises.push(API.GET('/proxy/node/account-transactions', params))
      } else {
        promises.push(
          API.GET('/proxy/node/events', {
            address,
            start: currentEvt,
            limit: chunkSize,
          })
        )
      }
      const res = await Promise.all(promises)
      if (txLength === chunkSize) {
        const txsRes = res[0]
        if (txsRes.status !== 200) {
          message.error(
            `Error fetching transactions (${txsRes.status} - ${txsRes.statusText})`
          )
          unfilteredBlocks.current = []
          setBlockFilters([])
          setBlockFiltersChecked({})
          setTransactions([])
          setTransactionsLoading(false)
          unfilteredEvents.current = []
          setEvents([])
          setEventFilters([])
          setEventFiltersChecked({})
          setEventsLoading(false)
          return
        }
        newTxs.unshift(
          ...txsRes.data.result
            .sort((a, b) => b.version - a.version)
            .map((tx) => {
              if (tx.events && tx.events.length) {
                const events = tx.events.filter(
                  (event) => event.data.type === 'sentpayment'
                )
                addEventFilter('sentpayment')
                newEvts.unshift(...events)
              }
              const txMin = getTransactionMin(tx)
              addBlockFilter(txMin.type)
              return txMin
            })
        )
        txLength = txsRes.data.result.length
        currentTx += txLength
        if (evtLength === chunkSize) {
          const evtsRes = res[1]
          console.log({ evtsRes })
          if (evtsRes) {
            if (evtsRes.status !== 200) {
              message.error(
                `Error fetching events (${evtsRes.status} - ${evtsRes.statusText})`
              )
              unfilteredBlocks.current = []
              setBlockFilters([])
              setBlockFiltersChecked({})
              setTransactions([])
              setTransactionsLoading(false)
              unfilteredEvents.current = []
              setEvents([])
              setEventFilters([])
              setEventFiltersChecked({})
              setEventsLoading(false)
              return
            }
            for (const event of evtsRes.data.result) {
              if (get(event, 'data.sender') === '00000000000000000000000000000000' && event.data.type === 'receivedpayment') {
                event.data.type = 'Received Reward'
              }
              addEventFilter(event.data.type)
            }
            newEvts.unshift(...evtsRes.data.result)
            evtLength = evtsRes.data.result.length
            currentEvt += evtLength
          }
        }
      } else {
        const evtsRes = res[0]
        if (evtsRes.status !== 200) {
          message.error(
            `Error fetching events (${evtsRes.status} - ${evtsRes.statusText})`
          )
          unfilteredBlocks.current = []
          setBlockFilters([])
          setBlockFiltersChecked({})
          setTransactions([])
          setTransactionsLoading(false)
          unfilteredEvents.current = []
          setEvents([])
          setEventFilters([])
          setEventFiltersChecked({})
          setEventsLoading(false)
          return
        }
        for (const event of evtsRes.data.result) {
          if (get(event, 'data.sender') === '00000000000000000000000000000000' && event.data.type === 'receivedpayment') {
            event.data.type = 'Received Reward'
          }
          addEventFilter(event.data.type)
        }
        newEvts.unshift(...evtsRes.data.result)
        evtLength = evtsRes.data.result.length
        currentEvt += evtLength
      }

      setTransactions(cloneDeep(newTxs))
      setEvents(cloneDeep(newEvts))
    }

    if (type === 'Validator') {
      const epochEvtsRes = await API.GET('/proxy/node/epoch-events', {
        address,
      })
      if (epochEvtsRes.status !== 200) {
        message.error(
          `Error fetching epoch events (${epochEvtsRes.status} - ${epochEvtsRes.statusText})`
        )
        unfilteredBlocks.current = []
        setBlockFilters([])
        setBlockFiltersChecked({})
        setTransactions([])
        setTransactionsLoading(false)
        unfilteredEvents.current = []
        setEvents([])
        setEventFilters([])
        setEventFiltersChecked({})
        setEventsLoading(false)
        return
      }

      for (const evt of epochEvtsRes.data) {
        if (evt.data.sender === evt.data.receiver) {
          evt.data.type = 'Burn'
        } else if (evt.data.receiver.toLowerCase() == operatorAccount.toLowerCase()) {
          evt.data.type = 'Operator Refill'
        } else {
          evt.data.type = 'AutoPay'
        }
        addEventFilter(evt.data.type)
      }

      newEvts.unshift(...epochEvtsRes.data)
    }

    const versionTimestamps = {}

    for (const tx of newTxs) {
      versionTimestamps[tx.version] = tx.timestamp
    }

    for (const evt of newEvts) {
      if (evt.timestamp) {
        continue
      }
      evt.timestamp = versionTimestamps[evt.transaction_version]
    }

    const eventFiltersMap = {}
    for (const evt of newEventFilters) {
      eventFiltersMap[evt] = true
    }

    const blockFiltersMap = {}
    for (const block of newBlockFilters) {
      blockFiltersMap[block] = true
    }
    
    setBlockFiltersChecked(blockFiltersMap)
    setBlockFilters(newBlockFilters.sort())

    setEventFiltersChecked(eventFiltersMap)
    setEventFilters(newEventFilters.sort())

    unfilteredBlocks.current = newTxs
    setTransactions(cloneDeep(newTxs))
    unfilteredEvents.current = newEvts.sort((a, b) => b.transaction_version - a.transaction_version)
    setEvents(cloneDeep(unfilteredEvents.current))

    setTransactionsLoading(false)
    setEventsLoading(false)
  }

  const lazyLoad = async (lowercaseAddress, lastEpochMined) => {
    const eventsKey = `0000000000000000${lowercaseAddress}`
    const errors = []
    const [
      { data: eventsRes, status: eventsStatus },
      { data: proofHistoryRes, status: proofHistoryStatus },
      {
        data: validatorPermissionTreeRes,
        status: validatorPermissionTreeStatus,
      },
      { data: minerPermissionTreeRes, status: minerPermissionTreeStatus },
    ] = await Promise.all([
      getEvents({ key: eventsKey, start: 0, limit: 1000 }),
      getMinerProofHistory(lowercaseAddress),
      getValidatorPermissionTree(lowercaseAddress),
      getMinerPermissionTree(lowercaseAddress),
    ])
    const nonZeroEvents = []
    if (eventsRes) {
      if (eventsRes.error) errors.push(eventsRes.error)
      nonZeroEvents.push(
        ...eventsRes.result.filter(
          (event) => event.data.sender !== '00000000000000000000000000000000'
        )
      )
    }

    let onboardedBy = null,
      validatorAccountCreatedBy = null,
      operatorAccount = null

    if (minerPermissionTreeStatus === 200 && minerPermissionTreeRes) {
      if (
        validatorPermissionTreeStatus === 404 ||
        !validatorPermissionTreeRes ||
        validatorPermissionTreeRes.parent !== minerPermissionTreeRes.parent
      ) {
        onboardedBy =
          minerPermissionTreeRes.parent === '00000000000000000000000000000000'
            ? 'Genesis'
            : minerPermissionTreeRes.parent
        setOnboardedBy(onboardedBy)
      }
      if (minerPermissionTreeRes.epoch_onboarded !== undefined) {
        setMinerEpochOnboarded(minerPermissionTreeRes.epoch_onboarded)
      }
      if (minerPermissionTreeRes.generation !== undefined) {
        setMinerGeneration(minerPermissionTreeRes.generation)
      }
    }

    if (validatorPermissionTreeStatus === 200 && validatorPermissionTreeRes) {
      validatorAccountCreatedBy = validatorPermissionTreeRes.parent
      setValidatorAccountCreatedBy(validatorAccountCreatedBy)
      if (validatorAccountCreatedBy === '00000000000000000000000000000000') {
        onboardedBy = 'Genesis'
        setOnboardedBy(onboardedBy)
      }
      if (validatorPermissionTreeRes.operator_address !== undefined) {
        operatorAccount = validatorPermissionTreeRes.operator_address
        setOperatorAccount(operatorAccount)
      }
      if (validatorPermissionTreeRes.epoch_onboarded !== undefined) {
        setValidatorEpochOnboarded(validatorPermissionTreeRes.epoch_onboarded)
      }
      if (validatorPermissionTreeRes.generation !== undefined) {
        setValidatorGeneration(validatorPermissionTreeRes.generation)
      }
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
              operatorAccount =
                get(operatorCreateEvent, 'data.receiver') || null
              setOperatorAccount(operatorAccount)
            }
          }
          validatorAccountCreatedBy = sender
          setValidatorAccountCreatedBy(validatorAccountCreatedBy)
        } else if (functionName === 'create_user_by_coin_tx')
          onboardedBy = sender
      }

      if (!onboardedBy && !validatorAccountCreatedBy) {
        onboardedBy = 'Genesis'
        setOnboardedBy(onboardedBy)
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
          if (operatorCreateEvent) {
            validatorAccountCreatedBy = '00000000000000000000000000000000'
            setValidatorAccountCreatedBy(validatorAccountCreatedBy)
          }
          operatorAccount = get(operatorCreateEvent, 'data.receiver') || null
          setOperatorAccount(operatorAccount)
        }
      }
    }

    const type = validatorAccountCreatedBy
      ? towerState
        ? 'Validator'
        : 'Operator'
      : towerState
      ? 'Miner'
      : Object.keys(CommunityWallets).indexOf(lowercaseAddress) !== -1
      ? 'Community Wallet'
      : ''

    getTransactionsAndEvents(type, lowercaseAddress, operatorAccount)

    if (operatorAccount) {
      const operatorProofsRes = await getMinerProofHistory(
        operatorAccount.toLowerCase()
      )
      if (operatorProofsRes.status === 200 && operatorProofsRes.data) {
        if (!proofHistoryRes) {
          if (operatorProofsRes.data.length > 0) {
            if (operatorProofsRes.data[0].epoch == lastEpochMined)
              operatorProofsRes.data.splice(0, 1)
            setProofHistory(operatorProofsRes.data)
          }
        } else {
          const proofs = proofHistoryRes
          for (const proof of operatorProofsRes.data) {
            let index = proofs.findIndex(
              (proofHistory) => proofHistory.epoch === proof.epoch
            )
            if (index !== -1) proofs[index].count += proof.count
            else proofs.push(proof)
          }

          if (proofs.length > 0) {
            proofs.sort((a, b) => b.epoch - a.epoch)
            if (proofs[0].epoch == lastEpochMined) proofs.splice(0, 1)
            setProofHistory(proofs)
          }
        }
      }
    } else if (proofHistoryRes) {
      if (proofHistoryRes.length > 0) {
        if (proofHistoryRes[0].epoch == lastEpochMined)
          proofHistoryRes.splice(0, 1)
        setProofHistory(proofHistoryRes)
      }
    }

    if (type === 'Validator') {
      const { data: vitals } = await API.GET('/webmonitor/vitals')
      const validatorAutoPayStats = vitals.chain_view.validator_view.find(
        (validator) =>
          validator.account_address.toLowerCase() === lowercaseAddress
      )
      setValidatorAutoPayStats(validatorAutoPayStats)
    }
    setType(type)
  }

  useEffect(() => {
    pageview('/address', 'address')
    if (account && account.address) {
      lazyLoad(
        account.address.toLowerCase(),
        towerState ? towerState.latest_epoch_mining : 0
      )
    }
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
              <span className={classes.addressText}>
                {get(account, 'address', '').toUpperCase()}
              </span>
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
                  fgColor="#000"
                  bgColor="#fff"
                  level={'M'}
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
                    <span className={classes.addressText}>
                      {onboardedBy ? onboardedBy.toUpperCase() : ''}
                    </span>
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
                      {validatorAccountCreatedBy
                        ? validatorAccountCreatedBy.toUpperCase()
                        : ''}
                    </span>
                  </a>
                </h1>
              )}
            {operatorAccount && (
              <h1 className={classes.onboardedBy}>
                {towerState ? 'Operator' : 'Validator'}
                {' Account: '}
                <a href={`/address/${operatorAccount}`}>
                  <span className={classes.addressText}>
                    {operatorAccount ? operatorAccount.toUpperCase() : ''}
                  </span>
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
                    Latest VDF Proof
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
                {(
                  get(validatorAutoPayStats, 'autopay.recurring_sum', 0) / 100
                ).toFixed(2)}
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
                    <a href={`/address/${address}`}>
                      {communityWallets[address]
                        ? communityWallets[address].text
                        : address
                        ? address.toUpperCase()
                        : ''}
                    </a>
                  ),
                },
                { title: 'Amount', dataIndex: 'amount' },
                { title: 'End Epoch', dataIndex: 'end_epoch' },
              ]}
              dataSource={get(validatorAutoPayStats, 'autopay.payments') || []}
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
            sortEnabled
            transactions={transactions}
            loading={transactionsLoading}
            pagination={{ pageSize, onChange: onPaginationChange }}
            top={
              <div>
                <div className={classes.outerHeader}>
                  <div className={classes.header}>
                    <span className={classes.title}>Tx</span>
                    {blockFilters.length > 0 &&
                    <div className={classes.filterBox}>
                       <a  className={classes.selectLink} onClick={()=> {
                        for (const type of blockFilters) {
                          blockFiltersChecked[type] = true
                        }
                        setBlockFiltersChecked(cloneDeep(blockFiltersChecked))
                        setTransactions(unfilteredBlocks.current)
                      }}>Select All</a>
                      <a className={classes.selectLink} onClick={()=> {
                        for (const type of blockFilters) {
                          blockFiltersChecked[type] = false
                        }
                        setBlockFiltersChecked(cloneDeep(blockFiltersChecked))
                        setTransactions([])
                      }}>Deselect All</a>
                      {blockFilters.map((type, i) => {
                        return <Checkbox key={`blockFilterCheckbox${i}`} checked={blockFiltersChecked[type]} onChange={(e: CheckboxChangeEvent) => {
                          blockFiltersChecked[type] = e.target.checked
                          setBlockFiltersChecked(cloneDeep(blockFiltersChecked))
                          setTransactions(unfilteredBlocks.current.filter(e => blockFiltersChecked[e.type]))
                        }}>{type}</Checkbox>
                      })}

                    </div>}
                  </div>
                  <div></div>
                </div>
              </div>
            }
          />
        </Col>
        <Col xs={24} sm={24} md={24} lg={11}>
          <EventsTable
            sortEnabled
            top={
              <div>
                <div className={classes.outerHeader}>
                  <div className={classes.header}>
                    <span className={classes.title}>Events</span>
                    {eventFilters.length > 0 &&
                    <div className={classes.filterBox}>
                       <a  className={classes.selectLink} onClick={()=> {
                        for (const type of eventFilters) {
                          eventFiltersChecked[type] = true
                        }
                        setEventFiltersChecked(cloneDeep(eventFiltersChecked))
                        setEvents(unfilteredEvents.current)
                      }}>Select All</a>
                      <a className={classes.selectLink} onClick={()=> {
                        for (const type of eventFilters) {
                          eventFiltersChecked[type] = false
                        }
                        setEventFiltersChecked(cloneDeep(eventFiltersChecked))
                        setEvents([])
                      }}>Deselect All</a>
                      {eventFilters.map((eventType, i) => {
                        return <Checkbox key={`eventFilterCheckbox${i}`} checked={eventFiltersChecked[eventType]} onChange={(e: CheckboxChangeEvent) => {
                          eventFiltersChecked[eventType] = e.target.checked
                          setEventFiltersChecked(cloneDeep(eventFiltersChecked))
                          setEvents(unfilteredEvents.current.filter(e => eventFiltersChecked[e.data.type]))
                        }}>{EventTypes[eventType] || eventType}</Checkbox>
                      })}
                    </div>}
                  </div>
                  <div></div>
                </div>
              </div>
            }
            events={events}
            loading={eventsLoading}
          />
        </Col>
      </Row>
    </NavLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { address } = ctx.params
  const addressSingle = Array.isArray(address) ? address[0] : address
  const [{ data: accountsRes }, { data: towerRes }] = await Promise.all([
    getAccount({ account: addressSingle }),
    getTowerState({ account: addressSingle }),
  ])

  const errors = []

  if (accountsRes) {
    if (accountsRes.error) errors.push(accountsRes.error)
    if (!accountsRes.result) ctx.res.statusCode = 404
  }

  const account: Account = accountsRes.result || null
  const towerState: TowerState = towerRes.result || null

  return {
    props: {
      account,
      towerState,
      errors,
    },
  }
}

export default AddressPage
