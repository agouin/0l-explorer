import { message } from 'antd'
import { GetServerSideProps } from 'next'
import classes from './version.module.scss'
import { getTransactions } from '../../lib/api/node'
import NavLayout from '../../components/navLayout/navLayout'
import {
  Transaction,
} from '../../lib/types/0l'
import { get } from 'lodash'
import TransactionView from '../../components/transactionView/transactionView'

const fallbackCopyTextToClipboard = (text) => {
  var textArea = document.createElement('textarea')
  textArea.value = text

  // Avoid scrolling to bottom
  textArea.style.top = '0'
  textArea.style.left = '0'
  textArea.style.position = 'fixed'

  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()

  try {
    var successful = document.execCommand('copy')
    var msg = successful ? 'successful' : 'unsuccessful'
    console.log('Fallback: Copying text command was ' + msg)
    message.success('Copied to clipboard')
  } catch (err) {
    message.error('Error copying to clipboard')
    console.error('Fallback: Oops, unable to copy', err)
  }

  document.body.removeChild(textArea)
}

const copyTextToClipboard = async (text) => {
  if (!navigator.clipboard) {
    fallbackCopyTextToClipboard(text)
    return
  }
  try {
    await navigator.clipboard.writeText(text)
    console.log('Async: Copying to clipboard was successful!')
    message.success('Copied to clipboard')
  } catch (err) {
    message.error('Error copying to clipboard')
    console.error('Async: Could not copy text: ', err)
  }
}

const AddressPage = ({
  transaction,
}: {
  transaction: Transaction
}) => {
  const hash = get(transaction, 'version')
  return (
    <NavLayout>
      
      <TransactionView transaction={transaction} top={<h1 className={classes.address} onClick={copyTextToClipboard.bind(this, hash)}>Transaction <span className={classes.addressText}>{hash}</span></h1>}/>
    </NavLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { version } = ctx.params
  console.log('Fetching tx', version)
  const versionSingle = Array.isArray(version) ? version[0] : version
  const { data: transactionRes, status: transactionStatus } = await getTransactions({
      startVersion: parseInt(versionSingle),
      limit: 1,
      includeEvents: true
    })

  console.log({
    transactionRes,
    transactionStatus,
  })

  return {
    props: {
      transaction: transactionRes.result[0] || null,
    },
  }
}

export default AddressPage
