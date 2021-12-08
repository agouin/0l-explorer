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
}

const EventTypes = {
  newblock: 'New Block',
  mint: 'Mint',
  receivedpayment: 'Received Payment',
  newepoch: 'New Epoch',
  sentpayment: 'Sent Payment',
  burn: 'Burn',
}

const EventColumns = [
  {
    key: 'version',
    dataIndex: 'transaction_version',
    width: 100,
    title: 'Height',
    render: (text) => <a href={`/block/${text}`}>{text}</a>,
  },
  {
    key: 'type',
    width: 200,
    title: 'Type',
    sorter: Sorter((record) => get(record, 'data.type')),
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
    sorter: Sorter((record) => get(record, 'data.amount.amount')),
    render: (_, record) => {
      const amount = get(record, 'data.amount.amount')
      if (amount == undefined) return ''
      return numberWithCommas(amount / 1000000)
    },
  },
  {
    key: 'sender',
    title: 'Sender',
    width: 300,
    render: (_, record) => {
      const address = get(record, 'data.sender')
      return <a href={`/address/${address}`}>{address}</a>
    },
  },
  {
    key: 'recipient',
    title: 'Recipient',
    width: 300,
    render: (_, record) => {
      const address = get(record, 'data.receiver')
      return <a href={`/address/${address}`}>{address}</a>
    },
  },
]

const EventsTable = ({ events, top, bottom }: EventsTableProps) => {
  const [pageSize, setPageSize] = useState(20)
  const onPageChange = (newPage, newPageSize) => setPageSize(newPageSize)
  return (
  <div className={classes.tableContainer}>
    <div className={classes.inner}>
      {top}
      <Table
        rowKey={(row) => `${row.transaction_version}_${row.sequence_number}`}
        scroll={{ x: true }}
        columns={EventColumns}
        dataSource={events}
        pagination={{ pageSize, onChange: onPageChange }}
      />
      {bottom}
    </div>
  </div>
)}

export default EventsTable
