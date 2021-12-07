import { Vitals } from './types/0l'
import EventSource from 'eventsource'

const { NODE_HOSTNAME } = process.env

export const hasInvite = (epochs_since_last_account_creation) =>
  epochs_since_last_account_creation >= 14

export const numberWithCommas = (x) => x.toLocaleString('en-US')

export const Sorter = (getField) => (a, b) => {
  const fieldA = getField(a)
  const fieldB = getField(b)
  if (fieldA < fieldB) {
    return -1
  }
  if (fieldA > fieldB) {
    return 1
  }
  return 0
}

export const timeDifference = (current, previous) => {
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

export const getVitals = (): Promise<Vitals> =>
  new Promise((res, rej) => {
    const uri = `http://${NODE_HOSTNAME}:3030/vitals`
    try {
      const sse = new EventSource(uri)
      sse.onmessage = (msg) => {
        sse.close()
        res(JSON.parse(msg.data))
      }
      sse.onerror = (err) => {
        sse.close()
        res({
          chain_view: {
            epoch: 0,
            height: 0,
            validator_count: 0,
            latest_epoch_change_time: 0,
            waypoint: '',
            //@ts-ignore
            upgrade: {},
            epoch_progress: 0,
            total_supply: 0,
            validator_view: [],
          },
        })
        //rej(err)
      }
    } catch (err) {
      rej(err)
    }
  })
