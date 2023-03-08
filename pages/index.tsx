import NavLayout from '../components/navLayout/navLayout'
import { GetServerSideProps } from 'next'
import { getTransactions, getRecentTransactions, getMetadata } from '../lib/api/node'
import { CaretLeftFilled, CaretRightFilled } from '@ant-design/icons'
import {
  getTransactionMin,
  TransactionMin,
  Vitals,
  StatsResponse,
  Event,
  EpochProofsResponse,
  PermissionNodeValidator,
} from '../lib/types/0l'
import TransactionsTable from '../components/transactionsTable/transactionsTable'
import classes from './index.module.scss'
import { message, Progress, Tooltip, Tabs, Col, Row } from 'antd'
import Search from 'antd/lib/input/Search'
import ValidatorsTable from '../components/validatorsTable/validatorsTable'
import { numberWithCommas, getVitals } from '../lib/utils'
import AutoPayTable from '../components/autoPayTable/autoPayTable'
import {
  getStats,
  getEpochProofSums,
  getValidators,
  getEpochsStats,
} from '../lib/api/permissionTree'
import EventsTable from '../components/eventsTable/eventsTable'
import { useEffect, useRef, useState } from 'react'
import { pageview } from '../lib/gtag'
import EpochsTable from '../components/epochsTable/epochsTable'
import UpgradesTable from '../components/upgradesTable/upgradesTable'
import { get } from 'lodash'
import InactiveValidatorsTable from '../components/inactiveValidatorsTable/inactiveValidatorsTable'
import { SortOrder } from 'antd/lib/table/interface'
import ErrorPage from './_error'
import { io } from 'socket.io-client'

const { TabPane } = Tabs

const MIN_VERSION = 0
const TX_PER_PAGE = 20

interface IndexPageProps {
  error: boolean
  transactions: TransactionMin[]
  events: Event[]
  startVersion: number
  latest: boolean
  previousIsLatest: boolean
  initialVitals: Vitals
  initialTab: string
  stats: StatsResponse
  epochMinerStats: Map<string, EpochProofsResponse>
  initialConsensusRound: number
  allValidators: PermissionNodeValidator[]
  validatorsMap: Map<string, PermissionNodeValidator>
  inactiveValidators: PermissionNodeValidator[]
  defaultSortKey: string
  defaultSortOrder: SortOrder
}

const IndexPage = ({
  error,
  transactions,
  events,
  latest,
  startVersion,
  previousIsLatest,
  initialVitals,
  initialTab,
  stats,
  epochMinerStats,
  initialConsensusRound,
  validatorsMap,
  inactiveValidators,
  defaultSortKey,
  defaultSortOrder,
}: IndexPageProps) => {
  if (error) {
    return (
      <ErrorPage>
        <div
          style={{ backgroundColor: '#B10022', margin: -16, paddingLeft: 16 }}>
          <h4 style={{ color: 'white' }}>
            0L network is undergoing maintenance
          </h4>
        </div>
      </ErrorPage>
    )
  }
  const [consensusRound, setConsensusRound] = useState(initialConsensusRound)
  const [vitals, setVitals] = useState(initialVitals)
  useEffect(() => {
    const page = `/?tab=${initialTab}${latest ? '' : `&start=${startVersion}`}`
    pageview(page, initialTab)
    const socket = io({ transports: ['websocket'] })
    socket.on('vitals', ({ vitals: newVitals, consensusRound: newRound }) => {
      setConsensusRound(newRound)
      setVitals(newVitals)
    })
  }, [])

  const start = useRef(startVersion)
  const tab = useRef(initialTab)
  const sortKey = useRef(defaultSortKey)
  const sortOrder = useRef(defaultSortOrder)

  const handleGoToVersion = (search: string) => {
    if (!search) {
      window.location.href = '/'
      return
    }
    const version = parseInt(search)
    if (isNaN(version)) {
      message.error('Invalid number')
      return
    }
    window.location.href = `/?start=${version}`
  }

  const pager = (
    <div className={classes.pager}>
      {(!latest && (
        <a
          href={
            previousIsLatest ? '/' : `/?start=${startVersion + TX_PER_PAGE}`
          }>
          {/* <Button type="primary" size="small" className={classes.pagerButton}> */}
          <CaretLeftFilled className={classes.pagerButton} />
          {/* </Button> */}
        </a>
      )) || (
        // <Button
        //   type="primary"
        //   size="small"
        //   className={classes.pagerButton}
        //   disabled
        // >
        <a style={{ cursor: 'not-allowed' }}>
          <CaretLeftFilled
            className={classes.pagerButton}
            style={{ color: '#aaa' }}
          />
        </a>
        // </Button>
      )}
      <a href={`/?start=${startVersion - TX_PER_PAGE}`}>
        {/* <Button type="primary" size="small" className={classes.pagerButton}> */}
        <CaretRightFilled className={classes.pagerButton} />
        {/* </Button> */}
      </a>
      {!latest && (
        <a className={classes.latestLink} href="/">
          Go to latest
        </a>
      )}
    </div>
  )

  const epochProgress = Math.floor(vitals.chain_view.epoch_progress * 1000) / 10

  const height = Math.max(
    vitals.chain_view.height,
    transactions.length > 0 ? transactions[0].version : 0
  )

  const handleRouteChange = () => {
    const query = {
      ...(tab.current == 'dashboard' && {
        ...(!latest && { start: `${start.current}` }),
      }),
      ...(tab.current == 'validators' && {
        ...(sortOrder.current &&
          sortOrder.current != 'descend' && { order: sortOrder.current }),
        ...(sortKey.current &&
          sortKey.current != 'voting_power' && { sort: sortKey.current }),
      }),
    }
    const page = `/${tab.current == 'dashboard' ? '' : tab.current}${
      Object.keys(query).length > 0
        ? `?${new URLSearchParams(query).toString()}`
        : ''
    }`
    window.history.pushState({}, null, page)
    return page
  }

  const handleTabChange = (newTab) => {
    tab.current = newTab
    const page = handleRouteChange()
    pageview(page, newTab)
  }

  const handleValidatorsSortChange = ({ order, columnKey }) => {
    sortKey.current = columnKey
    sortOrder.current = order
    handleRouteChange()
  }

  return (
    <NavLayout>
      <Tabs defaultActiveKey={initialTab} centered onChange={handleTabChange}>
        <TabPane key="dashboard" tab="Dashboard">
          <div className={classes.topStats}>
            <div className={classes.topStatsInner}>
              <div className={classes.infoRow}>
                <Tooltip title="Current block height">
                  <span className={classes.infoText}>
                    Height:{' '}
                    <span className={classes.thinText}>
                      {numberWithCommas(height)}
                    </span>
                  </span>
                </Tooltip>
                <Tooltip title="Current epoch (rewards are issued at start of epoch)">
                  <span className={classes.infoText}>
                    Epoch:{' '}
                    <span className={classes.thinText}>
                      {numberWithCommas(vitals.chain_view.epoch)}
                    </span>
                  </span>
                </Tooltip>
                <Tooltip title="Progress through current epoch (24 hours)">
                  <span className={classes.infoText}>
                    Epoch Progress:{' '}
                    <span className={classes.thinText}>{epochProgress}%</span>
                  </span>
                </Tooltip>
              </div>
              <Progress
                showInfo={false}
                strokeColor="#198be9"
                trailColor="#e3f2ff"
                className={classes.progressBar}
                strokeLinecap="square"
                percent={epochProgress}
              />
              <div className={classes.infoRow}>
                <Tooltip title="Total number of coins in circulation">
                  <span className={classes.infoText}>
                    Total Supply:{' '}
                    <span className={classes.thinText}>
                      {numberWithCommas(vitals.chain_view.total_supply)}
                    </span>
                  </span>
                </Tooltip>
                <Tooltip title="Total onboarded addresses">
                  <span className={classes.infoText}>
                    Total Addresses:{' '}
                    <span className={classes.thinText}>
                      {numberWithCommas(stats.allAccountCount)}
                    </span>
                  </span>
                </Tooltip>
                <Tooltip title="Addresses with tower height > 0">
                  <span className={classes.infoText}>
                    Total Miners:{' '}
                    <span className={classes.thinText}>
                      {numberWithCommas(stats.allMinerCount)}
                    </span>
                  </span>
                </Tooltip>
                <Tooltip title="Addresses that have submitted proofs in current or previous epoch">
                  <span className={classes.infoText}>
                    Active Miners:{' '}
                    <span className={classes.thinText}>
                      {numberWithCommas(stats.activeMinerCount)}
                    </span>
                  </span>
                </Tooltip>
              </div>
            </div>
          </div>
          <Row>
            <Col xs={24} sm={24} md={24} lg={13}>
              <TransactionsTable
                sortEnabled={false}
                transactions={transactions}
                pagination={false}
                top={
                  <div>
                    <div className={classes.outerHeader}>
                      <div className={classes.header}>
                        <span className={classes.title}>Blocks</span>
                        {pager}
                      </div>
                      <div className={classes.searchContainer}>
                        <Search
                          className={classes.versionSearch}
                          type="number"
                          placeholder="Jump to height"
                          onSearch={handleGoToVersion}
                          allowClear
                        />
                      </div>
                    </div>
                  </div>
                }
                bottom={<div style={{ marginTop: 8 }}>{pager}</div>}
              />
            </Col>
            <Col xs={24} sm={24} md={24} lg={11}>
              <EventsTable
                sortEnabled={false}
                top={
                  <div className={classes.outerHeader}>
                    <div className={classes.header}>
                      <span className={classes.title}>Events</span>
                    </div>
                  </div>
                }
                events={events}
              />
            </Col>
          </Row>
        </TabPane>
        <TabPane key="epochs" tab="Epochs">
          <EpochsTable
            currentEpoch={vitals.chain_view.epoch}
            epochMinerStats={epochMinerStats}
          />
        </TabPane>
        <TabPane key="validators" tab="Validators">
          <ValidatorsTable
            top={
              <>
                <h1 style={{ fontSize: 20, marginBottom: 0, marginTop: -16 }}>
                  Active Validator Set
                </h1>
                <span style={{ fontSize: 18, color: 'black' }}>
                  <b>Total:</b> {vitals.chain_view.validator_view.length}{' '}
                  <b>Current Round</b>: {consensusRound}
                </span>
              </>
            }
            validators={vitals.chain_view.validator_view}
            validatorsMap={validatorsMap}
            blocksInEpoch={consensusRound}
            onSortChange={handleValidatorsSortChange}
            defaultSortKey={defaultSortKey}
            defaultSortOrder={defaultSortOrder}
          />
          <InactiveValidatorsTable
            top={
              <span style={{ fontSize: 20, color: 'black' }}>
                Inactive Validators ({inactiveValidators.length})
              </span>
            }
            validators={inactiveValidators}
            validatorsMap={validatorsMap}
          />
        </TabPane>
        <TabPane key="autoPay" tab="Community Wallets">
          <AutoPayTable validators={vitals.chain_view.validator_view} />
        </TabPane>
        <TabPane key="upgrades" tab="Upgrades">
          <div className={classes.topStats}>
            <div className={classes.topStatsInner}>
              {get(
                vitals,
                'chain_view.upgrade.upgrade.vote_counts[0].hash.length'
              ) ? (
                <>
                  <div className={classes.infoRow}>
                    <Tooltip title="Number of validators that have voted on proposals during this voting window">
                      <span className={classes.infoText}>
                        Voters:{' '}
                        <span className={classes.thinText}>
                          {
                            vitals.chain_view.upgrade.upgrade.validators_voted
                              .length
                          }
                          /{vitals.chain_view.validator_count}
                        </span>
                      </span>
                    </Tooltip>
                    <Tooltip title="Proposal expires after this block height without consensus">
                      <span className={classes.infoText}>
                        Expiration:{' '}
                        <span className={classes.thinText}>
                          {vitals.chain_view.upgrade.upgrade.vote_window}
                        </span>
                      </span>
                    </Tooltip>
                  </div>
                </>
              ) : (
                <div>No Active Upgrade Voting</div>
              )}
            </div>
          </div>
          {get(
            vitals,
            'chain_view.upgrade.upgrade.vote_counts[0].hash.length'
          ) && <UpgradesTable vitals={vitals} />}
        </TabPane>
      </Tabs>
    </NavLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { query } = ctx

  let startVersion

  if (query && query.start) {
    startVersion = parseInt(query.start as string)
  }

  try {
    const [
      { data: metadataRes, status: metadataStatus },
      initialVitals,
      { data: permissionTreeStats, status: permissionTreeStatsStatus },
      { data: epochProofSums, status: epochProofSumsStatus },
      { data: epochStats, status: epochStatsStatus },
      { data: allValidators, status: validatorsStatus },
    ] = await Promise.all([
      getMetadata({}),
      getVitals(),
      getStats(),
      getEpochProofSums(),
      getEpochsStats(),
      getValidators(),
    ])
    if (metadataStatus !== 200 || metadataRes.error) return { props: {} }
    const {
      result: { version },
    } = metadataRes

    let latest = false
    if (startVersion === undefined || isNaN(startVersion)) {
      latest = true
      startVersion = version - TX_PER_PAGE
    }

    if (!latest) {
      if (startVersion < MIN_VERSION) startVersion = MIN_VERSION
      else if (startVersion > version) latest = true
    }

    const previousIsLatest = startVersion + 2 * TX_PER_PAGE > version

    let transactionsRes, transactionsStatus

    if (latest) {
      const { data, status } =
      await getRecentTransactions({
        startVersion: 0,
        limit: TX_PER_PAGE,
        includeEvents: true,
      })
      transactionsRes = data
      transactionsStatus = status
    } else {
      const { data, status } =
      await getTransactions({
        startVersion,
        limit: TX_PER_PAGE,
        includeEvents: true,
      })
      transactionsRes = data
      transactionsStatus = status
    }

    // console.log({transactionsRes: transactionsRes.result})

    const transactions: TransactionMin[] =
      transactionsStatus === 200 && transactionsRes.result
        ? transactionsRes.result
            .sort((a, b) => b.version - a.version)
            .map((tx) => getTransactionMin(tx))
        : []

    const events = []

    if (transactions && transactions.length && transactionsRes.result) {
      for (const transaction of transactionsRes.result) {
        events.push(...transaction.events)
      }
    }

    const stats = permissionTreeStatsStatus === 200 ? permissionTreeStats : {}

    const epochMinerStats = {}

    if (epochProofSumsStatus === 200) {
      for (const epochMinerStat of epochProofSums) {
        const {
          epoch,
          miners,
          proofs,
          miners_payable,
          miners_payable_proofs,
          validator_proofs,
          miner_payment_total,
        } = epochMinerStat
        epochMinerStats[epoch] = {
          miners,
          proofs,
          miners_payable,
          miners_payable_proofs,
          validator_proofs,
          ...(miner_payment_total != undefined && { miner_payment_total }),
        }
      }
    }

    if (epochStatsStatus === 200) {
      for (const epochStat of epochStats) {
        const {
          epoch,
          total_supply
        } = epochStat
        if (epochMinerStats[epoch]) {
          epochMinerStats[epoch].total_supply = total_supply
        }
      }
    }

    const validatorsMap = {}
    const inactiveValidators = []

    if (allValidators && Array.isArray(allValidators)) {
      inactiveValidators.push(
        ...allValidators.filter(
          (validator) =>
            !initialVitals.chain_view.validator_view.find(
              (activeVal) =>
                activeVal.account_address.toLowerCase() ===
                validator.address.toLowerCase()
            )
        )
      )

      for (const validator of allValidators) {
        validatorsMap[validator.address.toLowerCase()] = validator
      }
    }

    return {
      props: {
        error: false,
        transactions,
        events,
        startVersion,
        latest,
        previousIsLatest,
        initialVitals,
        stats,
        epochMinerStats,
        allValidators,
        inactiveValidators,
        validatorsMap,
        initialConsensusRound: global.consensusRound,
        initialTab: query.tab || 'dashboard',
        defaultSortKey: query.sort || 'voting_power',
        defaultSortOrder: query.order || 'descend',
      },
    }
  } catch (err) {
    console.error(err)
    return {
      props: {
        error: true,
        transactions: [],
        events: [],
        startVersion: -1,
        latest: true,
        previousIsLatest: false,
        initialVitals: {
          chain_view: {
            height: 0,
            epoch_progress: 0,
            validator_count: 0,
            epoch: 0,
            total_supply: 0,
            validator_view: [],
          },
        },
        stats: {},
        epochMinerStats: {},
        allValidators: [],
        inactiveValidators: [],
        validatorsMap: {},
        initialConsensusRound: 0,
        initialTab: query.tab || 'dashboard',
        defaultSortKey: query.sort || 'voting_power',
        defaultSortOrder: query.order || 'descend',
      },
    }
  }
}

export default IndexPage
