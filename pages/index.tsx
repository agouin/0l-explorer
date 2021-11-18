import NavLayout from '../components/navLayout/navLayout'
import { GetServerSideProps } from 'next'
import { getTransactions, getMetadata } from '../lib/api/node'
import { CaretLeftFilled, CaretRightFilled } from '@ant-design/icons'
import { getTransactionMin, TransactionMin } from '../lib/types/0l'
import TransactionsTable from '../components/transactionsTable/transactionsTable'
import classes from './index.module.scss'
import { Button } from 'antd'

const MIN_VERSION = 3542670
const TX_PER_PAGE = 100

interface IndexPageProps {
  transactions: TransactionMin[]
  startVersion: number
  latest: boolean
  previousIsLatest: boolean
}

const IndexPage = ({ transactions, latest, startVersion, previousIsLatest } : IndexPageProps) => {
  const pager = <div className={classes.pager}>
      {!latest && <a href={previousIsLatest ? '/': `/?start=${ startVersion + TX_PER_PAGE}`}><Button type="primary" className={classes.pagerButton}><CaretLeftFilled/></Button></a>}
      <a href={`/?start=${startVersion - TX_PER_PAGE}`}><Button type="primary" className={classes.pagerButton}><CaretRightFilled/></Button></a>
      {!latest && <a href="/"><Button type="primary" className={classes.pagerButton}>Go to latest</Button></a>}
  </div>
  return <NavLayout>
    <div className={classes.header}>
      <span className={classes.title}>Recent Transactions</span>
      {pager}
    </div>
    <TransactionsTable transactions={transactions}/>
    {pager}
  </NavLayout>
}


export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { query } = ctx

  let startVersion

  if (query && query.start) {
    startVersion = parseInt(query.start as string)
  }

  const { data: metadataRes, status: metadataStatus } = await getMetadata({})
  if (metadataStatus !== 200) return { props: {}}
  const { result: { version } } = metadataRes

  if (startVersion === undefined || isNaN(startVersion)) {
    startVersion = version - TX_PER_PAGE + 10
  }

  if (startVersion < MIN_VERSION) startVersion = MIN_VERSION

  const latest = startVersion + TX_PER_PAGE > version
  const previousIsLatest = startVersion + (2 * TX_PER_PAGE) > version
  
  const { data: transactionsRes, status: transactionsStatus } = await getTransactions({ startVersion, limit: 100, includeEvents: false })

  const transactions: TransactionMin[] = transactionsStatus === 200 ? transactionsRes.result.sort((a, b) => b.version - a.version).map(tx => getTransactionMin(tx)) : null

  return {
    props: {
      transactions,
      startVersion,
      latest,
      previousIsLatest
    },
  }
}


export default IndexPage