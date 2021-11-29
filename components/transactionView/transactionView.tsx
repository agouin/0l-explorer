import { Transaction } from '../../lib/types/0l'
import { get } from 'lodash'
import { Table } from 'antd'
import { ReactNode } from 'react'
import classes from './transactionView.module.scss'

interface TransactionViewProps {
  transaction: Transaction
  top?: ReactNode | undefined
  bottom?: ReactNode | undefined
}

const TransactionView = ({
  transaction,
  top,
  bottom,
}: TransactionViewProps) => {
  if (!transaction) return null
  const {
    transaction: tx,
    vm_status: { type: status },
  } = transaction

  const info: {
    key: string
    title: string
    value: ReactNode | string | undefined
  }[] = [
    { key: 'version', title: 'Version', value: transaction.version },
    { key: 'hash', title: 'Hash', value: transaction.hash },
    { key: 'status', title: 'Status', value: status },
    { key: 'type', title: 'Type', value: tx.type },
    { key: 'gas_used', title: 'Gas Used', value: transaction.gas_used },
  ]

  const sender = get(tx, 'sender')
  if (sender)
    info.push({
      key: 'sender',
      title: 'Sender',
      value: <a href={`/address/${sender}`}>{sender}</a>,
    })

  switch (tx.type) {
    case 'blockmetadata':
      info.push({
        key: 'timestamp_usecs',
        title: 'Timestamp',
        value: new Date(tx.timestamp_usecs / 1000).toLocaleString(),
      })
      break
    case 'user':
      const script_function = get(tx, 'script.function_name')
      if (script_function)
        info.push({
          key: 'script_function',
          title: 'Script Function',
          value: script_function,
        })

      if (script_function === 'create_user_by_coin_tx') {
        const onboard_address = get(tx, 'script.arguments_bcs[0]')
        if (onboard_address) {
          info.push({
            key: 'recipient',
            title: 'Onboard Address',
            value: (
              <a href={`/address/${onboard_address}`}>{onboard_address}</a>
            ),
          })
        }
      }
      info.push(
        {
          key: 'signature_scheme',
          title: 'Signature Scheme',
          value: tx.signature_scheme,
        },
        { key: 'signature', title: 'Signature', value: tx.signature },
        { key: 'public_key', title: 'Public Key', value: tx.public_key },
        {
          key: 'sequence_number',
          title: 'Sequence Number',
          value: tx.sequence_number,
        },
        { key: 'chain_id', title: 'Chain ID', value: tx.chain_id },
        {
          key: 'max_gas_amount',
          title: 'Max Gas Amount',
          value: tx.max_gas_amount,
        },
        {
          key: 'gas_unit_price',
          title: 'Gas Unit Price',
          value: tx.gas_unit_price,
        },
        { key: 'gas_currency', title: 'Currency', value: tx.gas_currency },
        {
          key: 'expiration_timestamp_secs',
          title: 'Expiration Timestamp',
          value: tx.expiration_timestamp_secs
            ? new Date(tx.expiration_timestamp_secs * 1000).toLocaleString()
            : '',
        }
      )
      break
    default:
      break
  }
  return (
    <div className={classes.tableContainer}>
      <div className={classes.inner}>
        {top}
        <Table
          pagination={false}
          scroll={{ x: true }}
          columns={[
            { key: 'key', dataIndex: 'title', title: 'Key' },
            { key: 'value', dataIndex: 'value', title: 'Value' },
          ]}
          dataSource={info}
        />
        {bottom}
      </div>
    </div>
  )
}

export default TransactionView
