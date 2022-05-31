import { Table, Tooltip } from 'antd'
import { ValidatorInfo } from '../../lib/types/0l'
import classes from './autoPayTable.module.scss'
import { ReactNode } from 'react'
import { event, outboundUrl } from '../../lib/gtag'
import CommunityWallets from '../../lib/communityWallets'

interface AutoPayTableProps {
  validators: ValidatorInfo[]
  top?: ReactNode | undefined
  bottom?: ReactNode | undefined
}

interface AddressRecord {
  address: string
}

const AutoPayTable = ({ validators, top, bottom }: AutoPayTableProps) => {
  const AutoPayColumns = [
    {
      key: 'address',
      width: 260,
      title: 'Address',
      render: (_, { address }: AddressRecord) => (
        <a href={`/address/${address}`}>{address ? address.toUpperCase() : ''}</a>
      ),
    },
    {
      key: 'name',
      title: 'Name',
      width: 300,
      render: (_, { address }: AddressRecord) => {
        const autoPay = CommunityWallets[address]
        return <a onClick={outboundUrl.bind(this, autoPay.link)} href={autoPay.link} target="_blank">{autoPay.text}</a>
      },
    },
    {
      key: 'validators',
      title: (
        <Tooltip title="Validators donating to this community wallet with auto pay">
          Participating Validators
        </Tooltip>
      ),
      width: 120,
      render: (_, { address }: AddressRecord) => {
        const participatingValidators = []
        for (const validator of validators) {
          if (!validator.autopay || !validator.autopay.payments) continue
          if (
            validator.autopay.payments.find(
              (payment) => payment.payee === address
            )
          )
            participatingValidators.push(validator.account_address)
        }
        return (
          <Tooltip
            overlayStyle={{ maxWidth: 350, maxHeight: 500, overflowY: 'auto' }}
            title={
              <>
                {participatingValidators.map((validatorAddress) => (
                  <div key={`part_vals_${address}_${validatorAddress}`}>
                    <a href={`/address/${validatorAddress}`}>
                      {validatorAddress.toUpperCase()}
                    </a>
                  </div>
                ))}
              </>
            }>
            <span>{participatingValidators.length}</span>
          </Tooltip>
        )
      },
    },
  ]

  return (
    <div className={classes.tableContainer}>
      <div className={classes.inner}>
        {top}
        <Table
          rowKey="address"
          scroll={{ x: true }}
          columns={AutoPayColumns}
          dataSource={Object.keys(CommunityWallets).map((address) => ({ address }))}
          pagination={false}
        />
        {bottom}
      </div>
    </div>
  )
}

export default AutoPayTable
