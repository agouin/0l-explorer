import { Table } from 'antd'
import { TransactionMin } from '../../lib/types/0l'
import { capitalCase } from 'change-case'
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons'

interface TransactionTableProps {
  transactions: TransactionMin[]
}

const getStateIcon = status => {
  if (status === 'executed') return <CheckCircleFilled style={{color: '#007054', marginLeft: 8}} />
  return <CloseCircleFilled style={{color: 'maroon', marginLeft: 8}}/>
}

const TransactionColumns = [
  { key: 'version',
    dataIndex: 'version',
    title: 'TX',
    render: (text) => <a href={`/tx/${text}`}>{text}</a>
  },
  {
    key: 'type',
    title: 'Type',
    dataIndex: 'type'
  },
  {
    key: 'status',
    title: 'Status',
    dataIndex: 'status',
  render: text => <div><span>{capitalCase(text)}</span>{getStateIcon(text)}</div>
  },
  {
    key: 'sender',
    dataIndex: 'sender',
    title: 'Sender',
    render: (text) => <a href={`/address/${text}`}>{text}</a>
  },
  {
    key: 'recipient',
    dataIndex: 'recipient',
    title: 'Recipient',
    render: (text) => <a href={`/address/${text}`}>{text}</a>
  },
]

const TransactionsTable = ({ transactions }: TransactionTableProps) => {
  return <Table columns={TransactionColumns} dataSource={transactions} pagination={false}/>
}

export default TransactionsTable
