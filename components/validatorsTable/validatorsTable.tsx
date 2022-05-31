import { Table, Tooltip } from 'antd'
import { ValidatorInfo, PermissionNodeValidator } from '../../lib/types/0l'
import classes from './validatorsTable.module.scss'
import { ReactNode } from 'react'
import {
  hasInvite,
  Sorter,
  EPOCHS_BEFORE_VALIDATOR_INVITE,
  PROOFS_THRESHOLD,
  VALIDATOR_VOTES_PERCENT_THRESHOLD,
} from '../../lib/utils'
import { get } from 'lodash'
import { SortOrder } from 'antd/lib/table/interface'
import communityWallets from '../../lib/communityWallets'
import BoolIcon from '../boolIcon/boolIcon'

interface ValidatorsTableProps {
  validators: ValidatorInfo[]
  validatorsMap: Map<string, PermissionNodeValidator>
  blocksInEpoch: number
  top?: ReactNode | undefined
  bottom?: ReactNode | undefined
  onSortChange: ({order, field, columnKey})=>void
  defaultSortKey: string
  defaultSortOrder: SortOrder
}

const ValidatorsTable = ({
  validators,
  validatorsMap,
  top,
  bottom,
  blocksInEpoch,
  onSortChange,
  defaultSortKey,
  defaultSortOrder
}: ValidatorsTableProps) => {
  const getDefaultSortOrder = key => {
    if (key == defaultSortKey) return defaultSortOrder
    return undefined
  }
  const ValidatorColumns = [
    { key: 'number', title: '#', width: 60, render: (_, __, i) => `${i + 1}` },
    {
      key: 'account_address',
      dataIndex: 'account_address',
      defaultSortOrder: getDefaultSortOrder('account_address'),
      width: 300,
      title: 'Account',
      render: (text) => <a href={`/address/${text}`}>{text.toUpperCase()}</a>,
    },
    {
      key: 'voting_power',
      title: 'Voting Power',
      defaultSortOrder: getDefaultSortOrder('voting_power'),
      dataIndex: 'voting_power',
      sorter: Sorter((record) => record.voting_power),
      width: 150,
    },
    {
      key: 'count_proofs_in_epoch',
      defaultSortOrder: getDefaultSortOrder('count_proofs_in_epoch'),
      title: 'Proofs in Epoch',
      dataIndex: 'count_proofs_in_epoch',
      sorter: Sorter((record) => record.tower_height - record.voting_power + 1),
      width: 150,
      render: (_, record) => {
        const count_proofs_in_epoch = record.tower_height - record.voting_power + 1
        const metThreshold = count_proofs_in_epoch > PROOFS_THRESHOLD
        return (
          <Tooltip
            title={
              metThreshold
                ? `Submitted more than the threshold of ${PROOFS_THRESHOLD} proofs in the current epoch`
                : `Must submit ${
                    PROOFS_THRESHOLD - count_proofs_in_epoch + 1
                  } more proof${
                    PROOFS_THRESHOLD - count_proofs_in_epoch == 0 ? '' : 's'
                  } in the current epoch to stay in the active validator set`
            }>
            <span>
              <BoolIcon condition={metThreshold} />
              {count_proofs_in_epoch}
            </span>
          </Tooltip>
        )
      },
    },
    {
      key: 'tower_height',
      defaultSortOrder: getDefaultSortOrder('tower_height'),
      title: 'Tower Height',
      dataIndex: 'tower_height',
      sorter: Sorter((record) => record.tower_height),
      width: 150,
    },
    {
      key: 'vote_count_in_epoch',
      defaultSortOrder: getDefaultSortOrder('vote_count_in_epoch'),
      title: 'Votes in Epoch',
      dataIndex: 'vote_count_in_epoch',
      sorter: Sorter((record) => record.vote_count_in_epoch),
      width: 150,
      render: (vote_count_in_epoch) => {
        const hasMetVotesThreshold =
          (100 * vote_count_in_epoch) / blocksInEpoch >
          VALIDATOR_VOTES_PERCENT_THRESHOLD
        return (
          <Tooltip
            title={
              hasMetVotesThreshold
                ? `Signed at least ${VALIDATOR_VOTES_PERCENT_THRESHOLD}% of rounds in the current epoch`
                : `Has not signed at least ${VALIDATOR_VOTES_PERCENT_THRESHOLD}% of rounds in the current epoch`
            }>
            <span>
            <BoolIcon condition={hasMetVotesThreshold}/>
              {vote_count_in_epoch}
            </span>
          </Tooltip>
        )
      },
    },
    {
      key: 'prop_count_in_epoch',
      defaultSortOrder: getDefaultSortOrder('prop_count_in_epoch'),
      title: 'Props in Epoch',
      dataIndex: 'prop_count_in_epoch',
      sorter: Sorter((record) => record.prop_count_in_epoch),
      width: 150,
    },
    {
      key: 'donation_percent',
      defaultSortOrder: getDefaultSortOrder('donation_percent'),
      title: 'Auto Pay Donation',
      dataIndex: 'donation_percent',
      sorter: Sorter((record: ValidatorInfo) =>
        get(record, 'autopay.recurring_sum', 0)
      ),
      width: 120,
      render: (_, record: ValidatorInfo) => {
        const autoPaySum = get(record, 'autopay.recurring_sum', 0)
        const hasAutoPay = autoPaySum > 0
        
        return <Tooltip overlayStyle={{ maxWidth: 500, maxHeight: 500, overflowY: 'auto' }} title={hasAutoPay ? <Table
          size="small"
          rowKey="payee"
          columns={[
            {
              title: 'Community Wallet',
              dataIndex: 'payee',
              render: (address) => (
                <a href={`/address/${address}`}>{communityWallets[address] ? communityWallets[address].text : address ? address.toUpperCase() : ''}</a>
              ),
            },
            { title: 'Amount', dataIndex: 'amount' },
            { title: 'End Epoch', dataIndex: 'end_epoch' },
          ]}
          dataSource={record.autopay.payments}
          pagination={{
            pageSize: 5,
            showSizeChanger: false,
            showQuickJumper: false,
            showPrevNextJumpers: true,
          }}
        /> : 'No Autopay Configured'}><span>
          {autoPaySum / 100 + '%'}
          </span></Tooltip> 
      },
    },
    {
      key: 'epochs_since_last_account_creation',
      defaultSortOrder: getDefaultSortOrder('epochs_since_last_account_creation'),
      title: 'Days since last account creation',
      dataIndex: 'epochs_since_last_account_creation',
      sorter: Sorter((record) => record.epochs_since_last_account_creation),
      width: 150,
      render: (epochs_since_last_account_creation) => {
        const canInvite = hasInvite(epochs_since_last_account_creation)

        return (
          <Tooltip
            title={
              canInvite
                ? 'Can onboard another validator'
                : `${
                    EPOCHS_BEFORE_VALIDATOR_INVITE -
                    epochs_since_last_account_creation
                  } epochs remaining until able to onboard another validator`
            }>
            <span>{epochs_since_last_account_creation}</span>
          </Tooltip>
        )
      },
    },
    {
      key: 'epoch_onboarded',
      defaultSortOrder: getDefaultSortOrder('epoch_onboarded'),
      title: 'Epoch Onboarded',
      width: 100,
      sorter: Sorter((record: ValidatorInfo) =>
        get(
          validatorsMap[record.account_address.toLowerCase()],
          'epoch_onboarded'
        )
      ),
      render: (_, record: ValidatorInfo) =>
        get(
          validatorsMap[record.account_address.toLowerCase()],
          'epoch_onboarded'
        ),
    },
  ]

  const handleTableChange = (_, __, sorter) => onSortChange(sorter)

  return (
    <div className={classes.tableContainer}>
      <div className={classes.inner}>
        {top}
        <Table
          rowKey="account_address"
          scroll={{ x: true }}
          columns={ValidatorColumns}
          dataSource={validators}
          pagination={false}
          onChange={handleTableChange}
        />
        {bottom}
      </div>
    </div>
  )
}

export default ValidatorsTable
