import { Table, TablePaginationConfig } from 'antd'
import { TransactionMin } from '../../lib/types/0l'
import { capitalCase } from 'change-case'
import classes from './transactionsTable.module.scss'
import { ReactNode } from 'react'
import BoolIcon from '../boolIcon/boolIcon'

interface TransactionTableProps {
  transactions: TransactionMin[]
  top?: ReactNode | undefined
  bottom?: ReactNode | undefined
  pagination: TablePaginationConfig | false
  loading?: boolean | false
}

const TransactionColumns = [
  {
    key: 'version',
    dataIndex: 'version',
    width: 100,
    title: 'Height',
    render: (text) => <a href={`/block/${text}`}>{text}</a>,
  },
  {
    key: 'timestamp',
    width: 180,
    title: 'Timestamp',
    dataIndex: 'timestamp',
    render: (timestamp) =>
      timestamp ? new Date(timestamp / 1000).toLocaleString() : '',
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
      <div className={classes.txStatus}>
        <BoolIcon condition={text === 'executed'}/>
        <span>{capitalCase(text)}</span>
      </div>
    ),
  },
  {
    key: 'sender',
    dataIndex: 'sender',
    title: 'Sender',
    width: 300,
    render: (text) => <a href={`/address/${text}`}>{text ? text.toUpperCase(): ''}</a>,
  },
  {
    key: 'recipient',
    dataIndex: 'recipient',
    title: 'Recipient',
    width: 300,
    render: (text) => <a href={`/address/${text}`}>{text ? text.toUpperCase(): ''}</a>,
  },
]

const TransactionsTable = ({
  transactions,
  pagination,
  top,
  bottom,
  loading,
}: TransactionTableProps) => {
  return (
    <div className={classes.tableContainer}>
      <div className={classes.inner}>
        {top}
        <Table
          loading={loading}
          rowKey="version"
          scroll={{ x: true }}
          columns={TransactionColumns}
          dataSource={transactions}
          pagination={pagination}
        />
        {bottom}
      </div>
    </div>
  )
}

export default TransactionsTable
