import NavLayout from '../components/navLayout/navLayout'
import { GetServerSideProps } from 'next'
import { getTransactions, getMetadata } from '../lib/api/node'
import { CaretLeftFilled, CaretRightFilled } from '@ant-design/icons'
import { getTransactionMin, TransactionMin, Vitals } from '../lib/types/0l'
import TransactionsTable from '../components/transactionsTable/transactionsTable'
import classes from './index.module.scss'
import { Button, message, Progress, Tooltip, Tabs } from 'antd'
import Search from 'antd/lib/input/Search'
import EventSource from 'eventsource'
import ValidatorsTable from '../components/validatorsTable/validatorsTable'
import { hasInvite, numberWithCommas } from '../lib/utils'
import AutoPayTable from '../components/autoPayTable/autoPayTable'

const { TabPane } = Tabs

const MIN_VERSION = 0
const TX_PER_PAGE = 100

interface IndexPageProps {
  transactions: TransactionMin[]
  startVersion: number
  latest: boolean
  previousIsLatest: boolean
  vitals: Vitals
  initialTab: string
}

const IndexPage = ({
  transactions,
  latest,
  startVersion,
  previousIsLatest,
  vitals,
  initialTab,
}: IndexPageProps) => {
  console.log({ vitals })
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

  const epochProgress = Math.round(vitals.chain_view.epoch_progress * 100)

  const height = Math.max(
    vitals.chain_view.height,
    transactions.length > 0 ? transactions[0].version : 0
  )

  const handleTabChange = (newTab) => {
    window.history.pushState({}, null, `/?tab=${newTab}${latest ? '' : `&start=${startVersion}`}`)
  }

  return (
    <NavLayout>
      <Tabs defaultActiveKey={initialTab} centered onChange={handleTabChange}>
        <TabPane key="dashboard" tab="Dashboard">
          <TransactionsTable
            transactions={transactions}
            top={
              <div>
                <div className={classes.infoRow}>
                  <span className={classes.infoText}>
                    Height: <span className={classes.thinText}>{height}</span>
                  </span>
                  <span className={classes.infoText}>
                    Epoch:{' '}
                    <span className={classes.thinText}>
                      {vitals.chain_view.epoch}
                    </span>
                  </span>
                  <span className={classes.infoText}>
                    Epoch Progress:{' '}
                    <span className={classes.thinText}>{epochProgress}%</span>
                  </span>
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
                  <span className={classes.infoText}>
                    Total Supply:{' '}
                    <span className={classes.thinText}>
                      {numberWithCommas(vitals.chain_view.total_supply)}
                    </span>
                  </span>
                </div>
                <div className={classes.outerHeader}>
                  <div className={classes.header}>
                    <span className={classes.title}>Transactions</span>
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
          <AutoPayTable autoPayInfo={vitals.account_view.autopay.payments} />
        </TabPane>
      </Tabs>
    </NavLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { query } = ctx

  const { NODE_HOSTNAME } = process.env

  let startVersion

  if (query && query.start) {
    startVersion = parseInt(query.start as string)
  }

  const getVitals = new Promise((res, rej) => {
    const uri = `http://${NODE_HOSTNAME}:3030/vitals`
    try {
      const sse = new EventSource(uri)
      sse.onmessage = (msg) => {
        console.log({ msg })
        sse.close()
        res(JSON.parse(msg.data))
      }
      sse.onerror = (err) => {
        sse.close()
        rej(err)
      }
    } catch (err) {
      rej(err)
    }
  })

  const [
    { data: metadataRes, status: metadataStatus },
    vitals,
  ] = await Promise.all([getMetadata({}), await getVitals])
  if (metadataStatus !== 200) return { props: {} }
  const {
    result: { version },
  } = metadataRes

  console.log({ vitals })

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
  } = await getTransactions({ startVersion, limit: 100, includeEvents: false })

  const transactions: TransactionMin[] =
    transactionsStatus === 200
      ? transactionsRes.result
          .sort((a, b) => b.version - a.version)
          .map((tx) => getTransactionMin(tx))
      : null

  return {
    props: {
      transactions,
      startVersion,
      latest,
      previousIsLatest,
      vitals,
      initialTab: query.tab || 'dashboard',
    },
  }
}

export default IndexPage
