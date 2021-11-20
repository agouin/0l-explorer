import { Table } from 'antd'
import { ValidatorInfo } from '../../lib/types/0l'
import classes from './validatorsTable.module.scss'
import { ReactNode } from 'react'
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons'
import { hasInvite } from '../../lib/utils'

interface ValidatorsTableProps {
  validators: ValidatorInfo[]
  top?: ReactNode | undefined
  bottom?: ReactNode | undefined
}

const Sorter = (getField) => (a, b) => {
  const fieldA = getField(a)
  const fieldB = getField(b)
  if (fieldA < fieldB) {
    return -1
  }
  if (fieldA > fieldB) {
    return 1
  }
  return 0
}

const getHasInviteIcon = (epochs_since_last_account_creation) => {
  if (hasInvite(epochs_since_last_account_creation))
    return <CheckCircleFilled style={{ color: '#007054', marginLeft: 8 }} />
  return <CloseCircleFilled style={{ color: 'maroon', marginLeft: 8 }} />
}


const ValidatorColumns = [
  {
    key: 'account_address',
    dataIndex: 'account_address',
    width: 300,
    title: 'Account',
    render: (text) => <a href={`/address/${text}`}>{text}</a>,
  },
  {
    key: 'voting_power',
    title: 'Voting Power',
    dataIndex: 'voting_power',
    sorter: Sorter((record)=> record.voting_power),
    width: 150,
  },
  {
    key: 'count_proofs_in_epoch',
    title: 'Proofs in Epoch',
    dataIndex: 'count_proofs_in_epoch',
    sorter: Sorter((record)=> record.count_proofs_in_epoch),
    width: 150,
  },
  {
    key: 'tower_height',
    title: 'Tower Height',
    dataIndex: 'tower_height',
    sorter: Sorter((record)=> record.tower_height),
    width: 150,
  },
  {
    key: 'vote_count_in_epoch',
    title: 'Votes in Epoch',
    dataIndex: 'vote_count_in_epoch',
    sorter: Sorter((record)=> record.vote_count_in_epoch),
    width: 150,
  },
  {
    key: 'prop_count_in_epoch',
    title: 'Props in Epoch',
    dataIndex: 'prop_count_in_epoch',
    sorter: Sorter((record)=> record.prop_count_in_epoch),
    width: 150,
  },
  {
    key: 'epochs_since_last_account_creation',
    title: 'Days since last account creation',
    dataIndex: 'epochs_since_last_account_creation',
    sorter: Sorter((record)=> record.epochs_since_last_account_creation),
    width: 150,
  render: epochs_since_last_account_creation => <span>{epochs_since_last_account_creation}{getHasInviteIcon(epochs_since_last_account_creation)}</span>
  },
]

const ValidatorsTable = ({
  validators,
  top,
  bottom,
}: ValidatorsTableProps) => {
  return (
    <div className={classes.tableContainer}>
      <div className={classes.inner}>
        {top}
        <Table
          scroll={{ x: true }}
          columns={ValidatorColumns}
          dataSource={validators}
          pagination={false}
        />
        {bottom}
      </div>
    </div>
  )
}

export default ValidatorsTable
