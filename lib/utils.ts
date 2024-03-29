import { Vitals } from './types/0l'

export const EPOCHS_BEFORE_VALIDATOR_INVITE = 14

export const PROOFS_THRESHOLD = 7

export const VALIDATOR_VOTES_PERCENT_THRESHOLD = 5

export const hasInvite = (epochs_since_last_account_creation) =>
  epochs_since_last_account_creation >= EPOCHS_BEFORE_VALIDATOR_INVITE

export const numberWithCommas = (x) => (x == null || x == undefined) ? null : x.toLocaleString('en-US')

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

export const decimalToHex = (d, padding) => {
  var hex = Number(d).toString(16);

  while (hex.length < padding) {
      hex = "0" + hex;
  }

  return hex;
}

export const formatCash = n => {
  if (n < 1e3) return n;
  if (n >= 1e3 && n < 1e6) return +(n / 1e3).toFixed(3) + "K";
  if (n >= 1e6 && n < 1e9) return +(n / 1e6).toFixed(3) + "M";
  if (n >= 1e9 && n < 1e12) return +(n / 1e9).toFixed(3) + "B";
  if (n >= 1e12) return +(n / 1e12).toFixed(3) + "T";
};

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

export const getVitals = ():Vitals => global.getVitals() as Vitals
 
