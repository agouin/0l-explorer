import { message } from 'antd'
import { GetServerSideProps } from 'next'
import { useEffect } from 'react'
import classes from './address.module.scss'
import {
  getAccount,
  getAccountTransactions,
  getTowerState,
} from '../../lib/api/node'
import NavLayout from '../../components/navLayout/navLayout'
import { AxiosResponse } from 'axios'
import {
  Account,
  AccountResponse,
  TransactionsResponse,
  TransactionMin,
  getTransactionMin,
  NodeRPCError,
  TowerStateResponse,
  TowerState,
} from '../../lib/types/0l'
import { get } from 'lodash'
import TransactionsTable from '../../components/transactionsTable/transactionsTable'
import { numberWithCommas } from '../../lib/utils'
import NotFoundPage from '../404'

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

interface AddressPageProps {
  account: Account
  transactions: TransactionMin[]
  towerState: TowerState
  errors: NodeRPCError[]
}

const AddressPage = ({
  account,
  transactions,
  towerState,
  errors,
}: AddressPageProps) => {
  if (!account) return NotFoundPage()

  useEffect(() => {
    if (errors.length > 0) {
      console.error(errors)
      for (const error of errors) {
        message.error(`${error.message} (${error.code})`)
      }
    }
  }, [])

  const balance = (get(account, 'balances[0].amount') || 0) / 1000000
  return (
    <NavLayout>
      <TransactionsTable
        transactions={transactions}
        top={
          <div>
            <h1
              className={classes.address}
              onClick={copyTextToClipboard.bind(this, account.address)}>
              Address:{' '}
              <span className={classes.addressText}>{account.address}</span>
            </h1>
            <h3
              className={classes.balance}
              onClick={copyTextToClipboard.bind(this, balance)}>
              Balance:{' '}
              <span className={classes.balanceText}>
                {numberWithCommas(balance)}
              </span>
            </h3>
            {towerState && (
              <>
              <div className={classes.infoRow}>
                <span className={classes.infoText}>
                  Tower Height:{' '}
                  <span className={classes.thinText}>
                    {towerState.verified_tower_height}
                  </span>
                </span>
                <span className={classes.infoText}>
                  Last Epoch Mined:{' '}
                  <span className={classes.thinText}>
                    {towerState.latest_epoch_mining}
                  </span>
                </span>
                <span className={classes.infoText}>
                  Proofs in Epoch:{' '}
                  <span className={classes.thinText}>
                    {towerState.count_proofs_in_epoch}
                  </span>
                </span>
              </div>
              <div className={classes.infoRow}>
                <span className={classes.infoText}>
                  Epochs Mining:{' '}
                  <span className={classes.thinText}>
                    {towerState.epochs_validating_and_mining}
                  </span>
                </span>
                <span className={classes.infoText}>
                  Contiguous Epochs Mining:{' '}
                  <span className={classes.thinText}>
                    {towerState.contiguous_epochs_validating_and_mining}
                  </span>
                </span>
                <span className={classes.infoText}>
                  Epochs Since Last Account Creation:{' '}
                  <span className={classes.thinText}>
                    {towerState.epochs_since_last_account_creation}
                  </span>
                </span>
              </div>
              </>
            )}
            <div className={classes.outerHeader}>
                  <div className={classes.header}>
                    <span className={classes.title}>Transactions</span>
                  </div>
                  <div >
                 
                  </div>
                </div>
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
    { data: towerRes, status: towerStatus },
  ]: [
    AxiosResponse<AccountResponse>,
    AxiosResponse<TransactionsResponse>,
    AxiosResponse<TowerStateResponse>
  ] = await Promise.all([
    getAccount({ account: addressSingle }),
    getAccountTransactions({
      account: addressSingle,
      start: 0,
      limit: 1000,
      includeEvents: false,
    }),
    getTowerState({ account: addressSingle }),
  ])

  const errors = []
  if (accountsRes.error) errors.push(accountsRes.error)
  if (transactionsRes.error) errors.push(transactionsRes.error)
  if (towerRes.error) errors.push(towerRes.error)

  if (errors.length > 0) {
    console.log({ errors })
    ctx.res.statusCode = 404
  }

  const account: Account = accountsRes.result || null
  const transactions: TransactionMin[] =
    transactionsStatus === 200 && !transactionsRes.error
      ? transactionsRes.result
          .sort((a, b) => b.version - a.version)
          .map((tx) => getTransactionMin(tx))
      : null
  const towerState: TowerState = towerRes.result || null

  return {
    props: {
      account,
      transactions,
      towerState,
      errors,
    },
  }
}

export default AddressPage
