import { Table } from 'antd'
import { TransactionMin } from '../../lib/types/0l'
import { capitalCase } from 'change-case'
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons'
import classes from './transactionsTable.module.scss'
import { ReactNode } from 'react'

interface TransactionTableProps {
  transactions: TransactionMin[]
  top?: ReactNode | undefined
  bottom?: ReactNode | undefined
}

const getStateIcon = (status) => {
  if (status === 'executed')
    return <CheckCircleFilled style={{ color: '#007054', marginLeft: 8 }} />
  return <CloseCircleFilled style={{ color: 'maroon', marginLeft: 8 }} />
}

const TransactionColumns = [
  {
    key: 'version',
    dataIndex: 'version',
    width: 100,
    title: 'Height',
    render: (text) => <a href={`/tx/${text}`}>{text}</a>,
  },
  {
    key: 'timestamp',
    width: 180,
    title: 'Timestamp',
    dataIndex: 'timestamp',
    render: (timestamp) => timestamp ? new Date(timestamp / 1000).toLocaleString() : ''
    
  },
  {
    key: 'type',
    title: 'Type',
    dataIndex: 'type',
    width: 150,
  },
  {
    key: 'status',
    title: 'Status',
    dataIndex: 'status',
    width: 150,
    render: (text) => (
      <div>
        <span>{capitalCase(text)}</span>
        {getStateIcon(text)}
      </div>
    ),
  },
  {
    key: 'sender',
    dataIndex: 'sender',
    title: 'Sender',
    width: 300,
    render: (text) => <a href={`/address/${text}`}>{text}</a>,
  },
  {
    key: 'recipient',
    dataIndex: 'recipient',
    title: 'Recipient',
    width: 300,
    render: (text) => <a href={`/address/${text}`}>{text}</a>,
  },
]

const TransactionsTable = ({
  transactions,
  top,
  bottom,
}: TransactionTableProps) => {
  return (
    <div className={classes.tableContainer}>
      <div className={classes.inner}>
        {top}
        <Table
          scroll={{ x: true }}
          columns={TransactionColumns}
          dataSource={transactions}
          pagination={false}
        />
        {bottom}
      </div>
    </div>
  )
}

export default TransactionsTable
