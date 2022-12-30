import { Table } from 'antd'
import { Event } from '../../lib/types/0l'
import classes from './eventsTable.module.scss'
import { ReactNode, useState } from 'react'
import { get } from 'lodash'
import { Sorter, numberWithCommas } from '../../lib/utils'

interface EventsTableProps {
  events: Event[]
  top?: ReactNode | undefined
  bottom?: ReactNode | undefined
  loading?: boolean | false
  sortEnabled: boolean
}

export const EventTypes = {
  newblock: 'New Block',
  mint: 'Mint',
  receivedpayment: 'Received Payment',
  newepoch: 'New Epoch',
  sentpayment: 'Sent Payment',
  burn: 'Burn',
}

const EventColumns = (sortEnabled) => [
  {
    key: 'version',
    dataIndex: 'transaction_version',
    width: 100,
    title: 'Height',
    sorter: sortEnabled
      ? Sorter((record) => get(record, 'transaction_version'))
      : undefined,
    render: (text) => <a href={`/block/${text}`}>{text}</a>,
  },
  {
    key: 'timestamp_usecs',
    width: 230,
    title: 'Timestamp',
    dataIndex: 'timestamp_usecs',
    sorter: sortEnabled
      ? Sorter((record) => get(record, 'timestamp_usecs') || 0)
      : undefined,
    render: (timestamp) =>
      timestamp ? new Date(timestamp / 1000).toLocaleString() : '',
  },
  {
    key: 'type',
    width: 200,
    title: 'Type',
    sorter: sortEnabled
      ? Sorter((record) => get(record, 'data.type'))
      : undefined,
    render: (_, record) => {
      const eventType = get(record, 'data.type')
      return get(record, 'data.sender') ===
        '00000000000000000000000000000000' && eventType === 'receivedpayment'
        ? 'Received Reward'
        : EventTypes[eventType] || eventType
    },
  },
  {
    key: 'amount',
    title: 'Amount',
    width: 150,
    sorter: sortEnabled
      ? Sorter((record) => get(record, 'data.amount.amount') || 0)
      : undefined,
    render: (_, record) => {
      const amount = get(record, 'data.amount.amount')
      if (amount == undefined) return '--'
      return numberWithCommas(amount / 1000000)
    },
  },
  {
    key: 'sender',
    title: 'Sender',
    width: 300,
    sorter: sortEnabled
      ? Sorter((record) => get(record, 'data.sender') || '')
      : undefined,
    render: (_, record) => {
      const address = get(record, 'data.sender')
      if (!address) return '--'
      return (
        <a href={`/address/${address}`}>
          {address ? address.toUpperCase() : ''}
        </a>
      )
    },
  },
  {
    key: 'recipient',
    title: 'Recipient',
    width: 300,
    sorter: sortEnabled
      ? Sorter((record) => get(record, 'data.receiver') || '')
      : undefined,
    render: (_, record) => {
      const address = get(record, 'data.receiver')
      if (!address) return '--'
      return (
        <a href={`/address/${address}`}>
          {address ? address.toUpperCase() : ''}
        </a>
      )
    },
  },
]

const EventsTable = ({
  events,
  top,
  bottom,
  loading,
  sortEnabled,
}: EventsTableProps) => {
  const [pageSize, setPageSize] = useState(20)
  const onPageChange = (newPage, newPageSize) => setPageSize(newPageSize)
  return (
    <div className={classes.tableContainer}>
      <div className={events.length === 0 ? classes.innerEmpty : classes.inner}>
        {top}
        <Table
          loading={loading}
          rowKey={(row) =>
            `${row.transaction_version}_${row.sequence_number}_${row.key}`
          }
          scroll={{ x: true }}
          columns={EventColumns(sortEnabled)}
          dataSource={events}
          pagination={{ pageSize, onChange: onPageChange }}
        />
        {bottom}
      </div>
    </div>
  )
}

export default EventsTable
