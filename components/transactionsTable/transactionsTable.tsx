import { Table, TablePaginationConfig } from 'antd'
import { TransactionMin } from '../../lib/types/0l'
import { capitalCase } from 'change-case'
import classes from './transactionsTable.module.scss'
import { ReactNode } from 'react'
import BoolIcon from '../boolIcon/boolIcon'
import { Sorter } from '../../lib/utils'
import { get } from 'lodash'

interface TransactionTableProps {
  transactions: TransactionMin[]
  top?: ReactNode | undefined
  bottom?: ReactNode | undefined
  pagination: TablePaginationConfig | false
  loading?: boolean | false
  sortEnabled: boolean
}

const TransactionColumns = (sortEnabled) => [
  {
    key: 'version',
    dataIndex: 'version',
    width: 100,
    title: 'Height',
    sorter: sortEnabled
      ? Sorter((record) => get(record, 'version'))
      : undefined,
    render: (text) => <a href={`/block/${text}`}>{text}</a>,
  },
  {
    key: 'timestamp',
    width: 180,
    title: 'Timestamp',
    dataIndex: 'timestamp',
    sorter: sortEnabled
      ? Sorter((record) => get(record, 'timestamp') || 0)
      : undefined,
    render: (timestamp) =>
      timestamp ? new Date(timestamp / 1000).toLocaleString() : '',
  },
  {
    key: 'type',
    title: 'Type',
    dataIndex: 'type',
    sorter: sortEnabled ? Sorter((record) => get(record, 'type')) : undefined,
    width: 150,
  },
  {
    key: 'status',
    title: 'Status',
    dataIndex: 'status',
    sorter: sortEnabled ? Sorter((record) => get(record, 'status')) : undefined,
    width: 150,
    render: (text) => (
      <div className={classes.txStatus}>
        <BoolIcon condition={text === 'executed'} />
        <span>{capitalCase(text)}</span>
      </div>
    ),
  },
  {
    key: 'sender',
    dataIndex: 'sender',
    title: 'Sender',
    sorter: sortEnabled
      ? Sorter((record) => get(record, 'sender') || '')
      : undefined,
    width: 300,
    render: (text) => (
      <a href={`/address/${text}`}>{text ? text.toUpperCase() : ''}</a>
    ),
  },
  {
    key: 'recipient',
    dataIndex: 'recipient',
    title: 'Recipient',
    sorter: sortEnabled
      ? Sorter((record) => get(record, 'recipient') || '')
      : undefined,
    width: 300,
    render: (text) => (
      <a href={`/address/${text}`}>{text ? text.toUpperCase() : ''}</a>
    ),
  },
]

const TransactionsTable = ({
  transactions,
  pagination,
  top,
  bottom,
  loading,
  sortEnabled,
}: TransactionTableProps) => {
  return (
    <div className={classes.tableContainer}>
      <div className={transactions.length === 0 ? classes.innerEmpty : classes.inner}>
        {top}
        <Table
          loading={loading}
          rowKey="version"
          scroll={{ x: true }}
          columns={TransactionColumns(sortEnabled)}
          dataSource={transactions}
          pagination={pagination}
        />
        {bottom}
      </div>
    </div>
  )
}

export default TransactionsTable
