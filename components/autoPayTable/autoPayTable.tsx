import { Table, Tooltip } from 'antd'
import { AutoPayPayments, ValidatorInfo } from '../../lib/types/0l'
import classes from './autoPayTable.module.scss'
import { ReactNode } from 'react'
import { Sorter } from '../../lib/utils'

interface AutoPayTableProps {
  autoPayInfo: AutoPayPayments[]
  validators: ValidatorInfo[]
  top?: ReactNode | undefined
  bottom?: ReactNode | undefined
}

const AutoPayNotes = {
  c906f67f626683b77145d1f20c1a753b:
    'Iqlusion Engineering Fund, https://github.com/iqlusioninc/0L-iqlusion-engineering-fund',
  '3a6c51a0b786d644590e8a21591fa8e2':
    'Fulltime Engineers Program https://github.com/iqlusioninc/0l-iqlusion-fulltime-engineering',
  bca50d10041fa111d1b44181a264a599:
    'A Good List, automated donations to non-profits, https://github.com/LOL-LLC/a-good-list',
  '2b0e8325dea5be93d856cfde2d0cba12':
    'Tip Jar, https://github.com/LOL-LLC/tip-jar',
  '19e966bfa4b32ce9b7e23721b37b96d2':
    'Benefits, Blockscience https://github.com/BlockScience/social-infrastructure-program',
  b31bd7796bc113013a2bf6c3953305fd:
    'Humanitarian, Red Cross, https://github.com/Danish-Red-Cross-Humanitarian-Fund',
  bc25f79fef8a981be4636ac1a2d6f587:
    'App Studio, Newlab, https://github.com/blockchainnewlab/Application-Studio/',
  '2057bcfb0189b7fd0aba7244ba271661':
    'Moonshots, LOL, https://github.com/LOL-LLC/moonshot-program',
  f605fe7f787551eea808ee9acdb98897: 'Human Rewards',
  c19c06a592911ed31c4100e9fb63ad7b:
    'RadicalxChange Foundation, https://github.com/RadicalxChange/RxC-Research-and-Experimentation',
  '1367b68c86cb27fa7215d9f75a26eb8f': 'UofT MSRG https://github.com/MSRG/D',
  bb6926434d1497a559e4f0487f79434f:
    'BlockScience Deep Tech Innovation Program https://github.com/BlockScience/deep-technology-innovation-program',
}

const getNoteWithLink = (note) => (
  <>
    {note
      .split(' ')
      .map((notePart) =>
        notePart.startsWith('http://') || notePart.startsWith('https://') ? (
          <a href={notePart}>{notePart}</a>
        ) : (
          <span>{notePart} </span>
        )
      )}
  </>
)

interface AddressRecord {
  address: string
}

const AutoPayTable = ({
  autoPayInfo,
  validators,
  top,
  bottom,
}: AutoPayTableProps) => {
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
      width: 600,
      render: (_, { address }: AddressRecord) =>
        getNoteWithLink(AutoPayNotes[address]),
    },
    {
      key: 'validators',
      title: 'Participating Validators',
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
                  <div>
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
