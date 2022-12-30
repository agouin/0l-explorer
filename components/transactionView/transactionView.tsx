import { Transaction } from '../../lib/types/0l'
import { getTimestamp } from '../../lib/node_utils'
import { get } from 'lodash'
import { Table } from 'antd'
import { ReactNode } from 'react'
import classes from './transactionView.module.scss'

interface TransactionViewProps {
  transaction: Transaction
  top?: ReactNode | undefined
  bottom?: ReactNode | undefined
}

const AbortCodeMap = {
  130108: 'Count above epoch threshold (130108)',
  130109: 'Proof is not consecutive (130109)',
  130110: 'Proof is false (130110)'
}

const TransactionView = ({
  transaction,
  top,
  bottom,
}: TransactionViewProps) => {
  if (!transaction) return null
  const { transaction: tx, vm_status } = transaction

  const info: {
    key: string
    title: string
    value: ReactNode | string | undefined
  }[] = [
    {
      key: 'timestamp_usecs',
      title: 'Timestamp',
      value: new Date(transaction.timestamp_usecs / 1000).toLocaleString(),
    },
    { key: 'version', title: 'Version', value: transaction.version },
    { key: 'hash', title: 'Hash', value: transaction.hash },
    { key: 'type', title: 'Type', value: tx.type },
    { key: 'gas_used', title: 'Gas Used', value: transaction.gas_used },
    { key: 'status', title: 'Status', value: vm_status.type },
  ]

  if (vm_status.type === 'move_abort') {
    info.push(
      {
        key: 'abort_code',
        title: 'Abort Code',
        value: AbortCodeMap[vm_status.abort_code] || vm_status.abort_code
      },
      {
        key: 'explanation',
        title: 'Explanation',
        value: vm_status.explanation,
      },
      {
        key: 'location',
        title: 'Location',
        value: vm_status.location,
      }
    )
  } else if (vm_status.type === 'execution_failure') {
    info.push(
      {
        key: 'location',
        title: 'Location',
        value: vm_status.location,
      },
      {
        key: 'function_index',
        title: 'Function Index',
        value: vm_status.function_index,
      },
      {
        key: 'code_offset',
        title: 'Code Offset',
        value: vm_status.code_offset,
      }
    )
  }

  const sender = get(tx, 'sender')
  if (sender)
    info.push({
      key: 'sender',
      title: 'Sender',
      value: <a href={`/address/${sender}`}>{sender ? sender.toUpperCase() : ''}</a>,
    })

  switch (tx.type) {
    case 'blockmetadata':
      
      break
    case 'user':
  
      const script_function = get(tx, 'script.function_name')
      
      if (script_function) {
        info.push({
          key: 'script_function',
          title: 'Script Function',
          value: script_function,
        })
        
      }

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
      <div className={info.length === 0 ? classes.innerEmpty : classes.inner}>
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
