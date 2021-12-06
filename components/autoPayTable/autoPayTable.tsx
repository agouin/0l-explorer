import { Table, Tooltip } from 'antd'
import { ValidatorInfo } from '../../lib/types/0l'
import classes from './autoPayTable.module.scss'
import { ReactNode } from 'react'
import { event, outboundUrl } from '../../lib/gtag'

interface AutoPayTableProps {
  validators: ValidatorInfo[]
  top?: ReactNode | undefined
  bottom?: ReactNode | undefined
}

const AutoPayNotes = {
  c906f67f626683b77145d1f20c1a753b: {
    text: 'The Iqlusion Engineering Program',
    link:
      'https://0l.network/community/community-programs/the-iqlusion-engineering-program',
  },
  '3a6c51a0b786d644590e8a21591fa8e2': {
    text: 'FTW: Ongoing Full-Time Workers Program',
    link:
      'https://0l.network/community/community-programs/ftw-ongoing-full-time-workers-program',
  },
  bca50d10041fa111d1b44181a264a599: {
    text: 'A Good List',
    link: 'https://0l.network/community/community-programs/a-good-list',
  },
  '2b0e8325dea5be93d856cfde2d0cba12': {
    text: 'Tip Jar',
    link: 'https://0l.network/community/community-programs/tip-jar',
  },
  '19e966bfa4b32ce9b7e23721b37b96d2': {
    text: 'Social Infrastructure Program',
    link:
      'https://0l.network/community/community-programs/social-infrastructure-program',
  },
  b31bd7796bc113013a2bf6c3953305fd: {
    text: 'Danish Red Cross Humanitarian Fund',
    link:
      'https://0l.network/community/community-programs/danish-red-cross-humanitarian-fund',
  },
  bc25f79fef8a981be4636ac1a2d6f587: {
    text: 'Application Studio',
    link: 'https://0l.network/community/community-programs/application-studio',
  },
  '2057bcfb0189b7fd0aba7244ba271661': {
    text: 'Moonshot Program',
    link: 'https://0l.network/community/community-programs/moonshot-program',
  },
  f605fe7f787551eea808ee9acdb98897: {
    text: 'Human Rewards Program',
    link:
      'https://0l.network/community/community-programs/human-rewards-program',
  },
  c19c06a592911ed31c4100e9fb63ad7b: {
    text: 'RxC Research and Experimentation (0L Fund)',
    link:
      'https://0l.network/community/community-programs/rxc-research-and-experimentation-0l-fund',
  },
  '1367b68c86cb27fa7215d9f75a26eb8f': {
    text: 'University of Toronto MSRG',
    link:
      'https://0l.network/community/community-programs/university-of-toronto-msrg',
  },
  bb6926434d1497a559e4f0487f79434f: {
    text: 'Deep Technology Innovation Program',
    link:
      'https://0l.network/community/community-programs/deep-technology-innovation-program',
  },
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
        <a href={`/address/${address}`}>{address}</a>
      ),
    },
    {
      key: 'name',
      title: 'Name',
      width: 300,
      render: (_, { address }: AddressRecord) => {
        const autoPay = AutoPayNotes[address]
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
                      {validatorAddress.toLowerCase()}
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
          dataSource={Object.keys(AutoPayNotes).map((address) => ({ address }))}
          pagination={false}
        />
        {bottom}
      </div>
    </div>
  )
}

export default AutoPayTable
