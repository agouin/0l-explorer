import { message } from 'antd'
import { GetServerSideProps } from 'next'
import { useEffect } from 'react'
import classes from './address.module.scss'
import { getAccount, getAccountTransactions } from '../../lib/api/node'
import NavLayout from '../../components/navLayout/navLayout'
import { AxiosResponse } from 'axios'
import {
  Account,
  AccountResponse,
  TransactionsResponse,
  TransactionMin,
  getTransactionMin,
  NodeRPCError,
} from '../../lib/types/0l'
import { get } from 'lodash'
import TransactionsTable from '../../components/transactionsTable/transactionsTable'

const timeDifference = (current, previous) => {
  const msPerMinute = 60 * 1000
  const msPerHour = msPerMinute * 60
  const msPerDay = msPerHour * 24
  const msPerMonth = msPerDay * 30
  const msPerYear = msPerDay * 365
  const elapsed = current - previous

  if (elapsed < msPerMinute) return Math.round(elapsed / 1000) + ' seconds ago'
  if (elapsed < msPerHour)
    return Math.round(elapsed / msPerMinute) + ' minutes ago'
  if (elapsed < msPerDay) return Math.round(elapsed / msPerHour) + ' hours ago'
  if (elapsed < msPerMonth) return Math.round(elapsed / msPerDay) + ' days ago'
  if (elapsed < msPerYear)
    return Math.round(elapsed / msPerMonth) + ' months ago'
  return Math.round(elapsed / msPerYear) + ' years ago'
}

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
  account,
  transactions,
  errors,
}: {
  account: Account
  transactions: TransactionMin[]
  errors: NodeRPCError[]
}) => {
  useEffect(() => {
    if (errors.length > 0) {
      console.error(errors)
      for (const error of errors) {
        message.error(`${error.message} (${error.code})`)
      }
    }
  }, [])

  const balance = get(account, 'balances[0].amount') || 0
  return (
    <NavLayout>
      <TransactionsTable
        transactions={transactions}
        top={
          <div>
            <h1
              className={classes.address}
              onClick={copyTextToClipboard.bind(this, account.address)}>
              Address{' '}
              <span className={classes.addressText}>{account.address}</span>
            </h1>
            <h3
              className={classes.balance}
              onClick={copyTextToClipboard.bind(this, `${balance}`)}>
              Balance:{' '}
              <span className={classes.balanceText}>{balance / 1000000}</span>
            </h3>
          </div>
        }
      />
    </NavLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { address } = ctx.params
  console.log('Fetching account', address)
  const addressSingle = Array.isArray(address) ? address[0] : address
  const [
    { data: accountsRes, status: accountsStatus },
    { data: transactionsRes, status: transactionsStatus },
  ]: [
    AxiosResponse<AccountResponse>,
    AxiosResponse<TransactionsResponse>
  ] = await Promise.all([
    getAccount({ account: addressSingle }),
    getAccountTransactions({
      account: addressSingle,
      start: 0,
      limit: 200,
      includeEvents: false,
    }),
  ])

  const errors = []
  if (accountsRes.error) errors.push(accountsRes.error)
  if (transactionsRes.error) errors.push(transactionsRes.error)

  const account: Account = accountsStatus === 200 ? accountsRes.result : null
  const transactions: TransactionMin[] =
    transactionsStatus === 200 && !transactionsRes.error
      ? transactionsRes.result
          .sort((a, b) => b.version - a.version)
          .map((tx) => getTransactionMin(tx))
      : null

  return {
    props: {
      account,
      transactions,
      errors,
    },
  }
}

export default AddressPage
