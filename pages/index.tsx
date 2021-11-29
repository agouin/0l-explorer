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
} from '../lib/types/0l'
import TransactionsTable from '../components/transactionsTable/transactionsTable'
import classes from './index.module.scss'
import { Button, message, Progress, Tooltip, Tabs, Col, Row } from 'antd'
import Search from 'antd/lib/input/Search'
import ValidatorsTable from '../components/validatorsTable/validatorsTable'
import { hasInvite, numberWithCommas, getVitals } from '../lib/utils'
import AutoPayTable from '../components/autoPayTable/autoPayTable'
import { getStats } from '../lib/api/permissionTree'
import EventsTable from '../components/eventsTable/eventsTable'

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
}: IndexPageProps) => {
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
          <Button type="primary" size="small" className={classes.pagerButton}>
            <CaretLeftFilled />
          </Button>
        </a>
      )) || (
        <Button
          type="primary"
          size="small"
          className={classes.pagerButton}
          disabled>
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
    window.history.pushState(
      {},
      null,
      `/?tab=${newTab}${latest ? '' : `&start=${startVersion}`}`
    )
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
                    Height: <span className={classes.thinText}>{height}</span>
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
        <TabPane key="validators" tab="Validators">
          <ValidatorsTable
            top={
              <span className={classes.infoText}>
                Validators:{' '}
                <Tooltip
                  title={
                    <span className={classes.infoText}>
                      Can create account:{' '}
                      <span className={classes.thinText}>
                        {
                          vitals.chain_view.validator_view.filter((validator) =>
                            hasInvite(
                              validator.epochs_since_last_account_creation
                            )
                          ).length
                        }
                      </span>
                    </span>
                  }>
                  <span className={classes.thinText}>
                    {vitals.chain_view.validator_count}
                  </span>
                </Tooltip>
              </span>
            }
            validators={vitals.chain_view.validator_view}
          />
        </TabPane>
        <TabPane key="autoPay" tab="Auto Pay">
          <AutoPayTable
            autoPayInfo={vitals.account_view.autopay.payments}
            validators={vitals.chain_view.validator_view}
          />
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
  ] = await Promise.all([getMetadata({}), getVitals(), getStats()])
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

  const {
    data: transactionsRes,
    status: transactionsStatus,
  } = await getTransactions({
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

  return {
    props: {
      transactions,
      events,
      startVersion,
      latest,
      previousIsLatest,
      vitals,
      stats,
      initialTab: query.tab || 'dashboard',
    },
  }
}

export default IndexPage
