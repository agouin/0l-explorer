import { Table } from 'antd'
import { AutoPayPayments } from '../../lib/types/0l'
import classes from './autoPayTable.module.scss'
import { ReactNode } from 'react'
import { Sorter } from '../../lib/utils'

interface AutoPayTableProps {
  autoPayInfo: AutoPayPayments[]
  top?: ReactNode | undefined
  bottom?: ReactNode | undefined
}


const AutoPayColumns = [
  {
    key: 'uid',
    title: 'UID',
    dataIndex: 'uid',
    sorter: Sorter((record)=> record.uid),
    width: 90,
  },
  {
    key: 'payee',
    dataIndex: 'payee',
    width: 300,
    title: 'Payee',
    render: (text) => <a href={`/address/${text}`}>{text}</a>,
  },
  {
    key: 'type_desc',
    title: 'Type',
    dataIndex: 'type_desc',
    sorter: Sorter((record)=> record.type_desc),
    width: 150,
  },
  {
    key: 'end_epoch',
    title: 'End Epoch',
    dataIndex: 'end_epoch',
    sorter: Sorter((record)=> record.end_epoch),
    width: 120,
  },
  {
    key: 'amount',
    title: 'Amount',
    dataIndex: 'amount',
    sorter: Sorter((record)=> parseInt(record.amount)),
    width: 120,
  }
]

const AutoPayTable = ({
  autoPayInfo,
  top,
  bottom,
}: AutoPayTableProps) => {
  return (
    <div className={classes.tableContainer}>
      <div className={classes.inner}>
        {top}
        <Table
          scroll={{ x: true }}
          columns={AutoPayColumns}
          dataSource={autoPayInfo}
          pagination={false}
        />
        {bottom}
      </div>
    </div>
  )
}

export default AutoPayTable
