import NavLayout from '../components/navLayout/navLayout'
import { GetServerSideProps } from 'next'
import { getTransactions, getCurrencies, getMetadata } from '../lib/api/node'
import { getTransactionMin, TransactionMin } from '../lib/types/0l'
import TransactionsTable from '../components/transactionsTable/transactionsTable'

interface IndexPageProps {
  transactions: TransactionMin[]
}

const IndexPage = ({ transactions} : IndexPageProps) => {
  return <NavLayout>
    <h1 style={{color:'white'}}>Recent Transactions</h1>
    <TransactionsTable transactions={transactions}/>
  </NavLayout>
}


export const getServerSideProps: GetServerSideProps = async (ctx) => {

  const { data: metadataRes, status: metadataStatus } = await getMetadata({})
  if (metadataStatus !== 200) return { props: {}}
  const { result: { version } } = metadataRes
  
  const { data: transactionsRes, status: transactionsStatus } = await getTransactions({ startVersion: version - 90, limit: 100, includeEvents: false })

  console.log({
    transactionsRes,
    transactionsStatus,
  })

  console.log(transactionsRes.result.length)

  const transactions: TransactionMin[] = transactionsStatus === 200 ? transactionsRes.result.sort((a, b) => b.version - a.version).map(tx => getTransactionMin(tx)) : null

  return {
    props: {
      transactions,
    },
  }
}


export default IndexPage