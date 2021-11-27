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
  1: 'Iqlusion Engineering Fund, https://github.com/iqlusioninc/0L-iqlusion-engineering-fund',
  2: 'Fulltime Engineers Program',
  3: 'A Good List, automated donations to non-profits, https://github.com/LOL-LLC/a-good-list',
  4: 'Tip Jar, https://github.com/LOL-LLC/tip-jar',
  5: 'Benefits, Blockscience',
  6: 'Humanitarian, Red Cross, https://github.com/Danish-Red-Cross-Humanitarian-Fund',
  7: 'App Studio, Newlab, https://github.com/blockchainnewlab/Application-Studio/',
  8: 'Moonshots, LOL, https://github.com/LOL-LLC/moonshot-program',
  9: 'Human Rewards',
  10: 'RadicalxChange Foundation, https://github.com/RadicalxChange/RxC-Research-and-Experimentation',
  11: 'UofT MSRG',
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

const AutoPayTable = ({
  autoPayInfo,
  validators,
  top,
  bottom,
}: AutoPayTableProps) => {
  const AutoPayColumns = [
    {
      key: 'uid',
      title: 'UID',
      dataIndex: 'uid',
      sorter: Sorter((record: AutoPayPayments) => record.uid),
      width: 90,
    },
    {
      key: 'note',
      title: 'Note',
      dataIndex: 'note',
      width: 300,
      render: (_, record: AutoPayPayments) =>
        getNoteWithLink(AutoPayNotes[record.uid]),
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
      sorter: Sorter((record) => record.type_desc),
      width: 150,
    },
    {
      key: 'end_epoch',
      title: 'End Epoch',
      dataIndex: 'end_epoch',
      sorter: Sorter((record) => record.end_epoch),
      width: 120,
    },
    {
      key: 'amount',
      title: 'Amount',
      dataIndex: 'amount',
      sorter: Sorter((record) => parseInt(record.amount)),
      width: 120,
    },
    {
      key: 'validators',
      title: 'Participating Validators',
      width: 120,
      render: (_, record: AutoPayPayments) => {
        const participatingValidators = []
        for (const validator of validators) {
          if (
            validator.autopay.payments.find(
              (payment) => payment.payee === record.payee
            )
          )
            participatingValidators.push(validator.account_address)
        }
        return (
          <Tooltip
            overlayStyle={{ maxWidth: 350, maxHeight: 500, overflowY: 'auto' }}
            title={
              <>
                {participatingValidators.map((address) => (
                  <div>
                    <a href={`/address/${address}`}>{address.toLowerCase()}</a>
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
          dataSource={autoPayInfo}
          pagination={false}
        />
        {bottom}
      </div>
    </div>
  )
}

export default AutoPayTable
