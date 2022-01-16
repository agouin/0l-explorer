import NavLayout from '../components/navLayout/navLayout'
import { GetServerSideProps } from 'next'
import { getTransactions, getMetadata } from '../lib/api/node'
import { CaretLeftFilled, CaretRightFilled } from '@ant-design/icons'
import {
  getTransactionMin,
  TransactionMin,
  Vitals,
  StatsResponse,
  Event,
  EpochProofsResponse,
  ValidatorPermissionTreeResponse,
  PermissionNodeValidator,
} from '../lib/types/0l'
import TransactionsTable from '../components/transactionsTable/transactionsTable'
import classes from './index.module.scss'
import { Button, message, Progress, Tooltip, Tabs, Col, Row, Table } from 'antd'
import Search from 'antd/lib/input/Search'
import ValidatorsTable from '../components/validatorsTable/validatorsTable'
import { hasInvite, numberWithCommas, getVitals } from '../lib/utils'
import AutoPayTable from '../components/autoPayTable/autoPayTable'
import { getStats, getEpochProofSums, getValidators, getEpochStats } from '../lib/api/permissionTree'
import EventsTable from '../components/eventsTable/eventsTable'
import { useEffect } from 'react'
import { pageview } from '../lib/gtag'
import EpochsTable from '../components/epochsTable/epochsTable'
import UpgradesTable from '../components/upgradesTable/upgradesTable'
import { get } from 'lodash'
import { execSync } from 'child_process'
import InactiveValidatorsTable from '../components/inactiveValidatorsTable/inactiveValidatorsTable'

const { TabPane } = Tabs

const MIN_VERSION = 0
const TX_PER_PAGE = 20

interface IndexPageProps {
  transactions: TransactionMin[]
  events: Event[]
  startVersion: number
  latest: boolean
  previousIsLatest: boolean
  vitals: Vitals
  initialTab: string
  stats: StatsResponse
  epochMinerStats: Map<string, EpochProofsResponse>
  blocksInEpoch: number
  allValidators: PermissionNodeValidator[]
  validatorsMap: Map<string, PermissionNodeValidator>
  inactiveValidators: PermissionNodeValidator[]
  vals: any
}

const IndexPage = ({
  transactions,
  events,
  latest,
  startVersion,
  previousIsLatest,
  vitals,
  initialTab,
  stats,
  epochMinerStats,
  blocksInEpoch,
  validatorsMap,
  inactiveValidators,
  vals
}: IndexPageProps) => {
  useEffect(() => {
    const page = `/?tab=${initialTab}${latest ? '' : `&start=${startVersion}`}`
    pageview(page, initialTab)
  }, [])

  //console.log(JSON.stringify(vals.filter(val => val.reachable)))

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
          }
        >
          <Button type="primary" size="small" className={classes.pagerButton}>
            <CaretLeftFilled />
          </Button>
        </a>
      )) || (
        <Button
          type="primary"
          size="small"
          className={classes.pagerButton}
          disabled
        >
          <CaretLeftFilled />
        </Button>
      )}
      <a href={`/?start=${startVersion - TX_PER_PAGE}`}>
        <Button type="primary" size="small" className={classes.pagerButton}>
          <CaretRightFilled />
        </Button>
      </a>
      {!latest && <a href="/">Go to latest</a>}
    </div>
  )

  const epochProgress = Math.floor(vitals.chain_view.epoch_progress * 1000) / 10

  const height = Math.max(
    vitals.chain_view.height,
    transactions.length > 0 ? transactions[0].version : 0
  )

  const handleTabChange = (newTab) => {
    const page = `/?tab=${newTab}${latest ? '' : `&start=${startVersion}`}`
    window.history.pushState({}, null, page)
    pageview(page, newTab)
  }

  const getCurrentUpgradeConsensus = () => {
    if (!vitals.chain_view.upgrade) return null
    let totalVotingPower = 0
    for (const validator of vitals.chain_view.validator_view) {
      totalVotingPower += validator.voting_power
    }
    let totalWeight = 0
    for (const vote of vitals.chain_view.upgrade.upgrade.votes) {
    totalWeight += vote.weight
    }
   // const totalWeight = get(vitals, 'chain_view.upgrade.upgrade.consensus.total_weight')
    const percentage = (100.0 * totalWeight / totalVotingPower)

    return <span>{totalWeight}/{totalVotingPower} (<span style={{ color: percentage > (200.0/3.0) ? 'rgb(1 217 163)':'maroon' }}>{percentage.toFixed(2)}%</span>)</span>
  }

  console.log({upgrade: vitals.chain_view.upgrade})

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
                      {vitals.chain_view.epoch}
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
                trailColor="#003028"
                strokeColor="#00806a"
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
                      {stats.allAccountCount}
                    </span>
                  </span>
                </Tooltip>
                <Tooltip title="Addresses with tower height > 0">
                  <span className={classes.infoText}>
                    Total Miners:{' '}
                    <span className={classes.thinText}>
                      {stats.allMinerCount}
                    </span>
                  </span>
                </Tooltip>
                <Tooltip title="Addresses that have submitted proofs in current epoch">
                  <span className={classes.infoText}>
                    Active Miners:{' '}
                    <span className={classes.thinText}>
                      {stats.activeMinerCount}
                    </span>
                  </span>
                </Tooltip>
              </div>
            </div>
          </div>
          <Row>
            <Col xs={24} sm={24} md={24} lg={13}>
              <TransactionsTable
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
                bottom={pager}
              />
            </Col>
            <Col xs={24} sm={24} md={24} lg={11}>
              <EventsTable
                top={
                  <div className={classes.header}>
                    <span className={classes.title}>Events</span>
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
            top={<span style={{fontSize: 20}}>Active Validator Set ({vitals.chain_view.validator_count})</span>}
            validators={vitals.chain_view.validator_view}
            validatorsMap={validatorsMap}
            blocksInEpoch={blocksInEpoch}
          />
          <InactiveValidatorsTable
            top={<span style={{fontSize: 20}}>Inactive Validators ({inactiveValidators.length})</span>}
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
              {get(vitals, 'chain_view.upgrade.upgrade.vote_counts[0].hash.length') ? (
                <>
                 {get(vitals, 'chain_view.upgrade.upgrade.consensus.hash') &&
                  <div className={classes.infoRow}>
                    <Tooltip title="Hash of proposed stdlib binary">
                      <span className={classes.infoText}>
                        Hash:{' '}
                        <span className={classes.thinText}>
                          {vitals.chain_view.upgrade.upgrade.vote_counts[0].hash
                            .map((x) => x.toString(16))
                            .join('')}
                        </span>
                      </span>
                    </Tooltip>
                  </div>}
                  <div className={classes.infoRow}>
                    <Tooltip title="Number of validators that have voted with approval on this proposal">
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
                  <div className={classes.infoRow}>
                    <Tooltip title="Current consensus (voted voting power out of total validator voting power)">
                      <span className={classes.infoText}>
                        Consensus:{' '}
                        <span className={classes.thinText}>
                          {getCurrentUpgradeConsensus()}
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
          {get(vitals, 'chain_view.upgrade.upgrade.vote_counts[0].hash.length') && <UpgradesTable vitals={vitals} />}
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

  const [
    { data: metadataRes, status: metadataStatus },
    vitals,
    { data: permissionTreeStats, status: permissionTreeStatsStatus },
    { data: epochProofSums, status: epochProofSumsStatus },
    { data: allValidators, status: validatorsStatus }
  ] = await Promise.all([
    getMetadata({}),
    getVitals(),
    getStats(),
    getEpochProofSums(),
    getValidators()
  ])
  if (metadataStatus !== 200) return { props: {} }
  const {
    result: { version },
  } = metadataRes

  if (startVersion === undefined || isNaN(startVersion)) {
    startVersion = version - TX_PER_PAGE + 10
  }

  if (startVersion < MIN_VERSION) startVersion = MIN_VERSION
  else if (startVersion > version) startVersion = version - TX_PER_PAGE + 10

  const latest = startVersion + TX_PER_PAGE > version
  const previousIsLatest = startVersion + 2 * TX_PER_PAGE > version

  const { data: transactionsRes, status: transactionsStatus } =
    await getTransactions({
      startVersion,
      limit: TX_PER_PAGE,
      includeEvents: true,
    })

  const transactions: TransactionMin[] =
    transactionsStatus === 200
      ? transactionsRes.result
          .sort((a, b) => b.version - a.version)
          .map((tx) => getTransactionMin(tx))
      : null

  const events = []

  if (transactions) {
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

  const inactiveValidators = allValidators.filter(validator => !vitals.chain_view.validator_view.find(activeVal => activeVal.account_address.toLowerCase() === validator.address.toLowerCase()))

  const validatorsMap = {}

  for (const validator of allValidators) {
    validatorsMap[validator.address.toLowerCase()] = validator
  }

  const vals = vitals.chain_view.validator_view.map(validator => ({ 
    address: validator.account_address, ip:validator.full_node_ip.match(/\/ip4\/(.*?)\/tcp\/(\d+)\/.*/).splice(1,2), reachable: null
  }))

  // for (let i = 0; i < vals.length; i++) {
  //   try {
  //     execSync(`nc -zw5 ${vals[i].ip[0]} 8080`)
  //     vals[i].reachable = true
  //   } catch(err) {
  //     vals[i].reachable = false
  //     console.log('val not reachable',  vals[i])
  //   }
  // }

  let blocksInEpoch = 0

  if (vitals.chain_view.epoch) {
    const currentEpochRes = await getEpochStats(vitals.chain_view.epoch)
    if (currentEpochRes.status === 200) {
      blocksInEpoch = vitals.chain_view.height - currentEpochRes.data.height
    }
  }

  return {
    props: {
      transactions,
      events,
      startVersion,
      latest,
      previousIsLatest,
      vitals,
      stats,
      epochMinerStats,
      allValidators,
      inactiveValidators,
      validatorsMap,
      blocksInEpoch,
      initialTab: query.tab || 'dashboard',
      vals
    },
  }
}

export default IndexPage
