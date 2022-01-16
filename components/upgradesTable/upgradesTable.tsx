import { Table } from 'antd'
import { Vitals } from '../../lib/types/0l'
import classes from './upgradesTable.module.scss'
import { ReactNode } from 'react'

interface UpgradesTableProps {
  vitals: Vitals
  top?: ReactNode | undefined
  bottom?: ReactNode | undefined
}

const UpgradesTable = ({ vitals, top, bottom }: UpgradesTableProps) => {
  return (
    <div className={classes.tableContainer}>
      <div className={classes.inner}>
        {top}
        <Table
          dataSource={vitals.chain_view.upgrade.upgrade.votes}
          columns={[
            {
              dataIndex: 'validator',
              title: 'Validator',
              width: 300,
              render: (address) => (
                <a href={`/address/${address}`}>{address}</a>
              ),
            },
            { dataIndex: 'weight', width: 100, title: 'Weight' },
          ]}
          pagination={false}
        />
        {bottom}
      </div>
    </div>
  )
}

export default UpgradesTable
