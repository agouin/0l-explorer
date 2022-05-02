const API = require('./index')
const getConfig = require('next/config').default
const { get } = require('lodash')

const { PERMISSION_TREE_API_PRIVATE_URL } = process.env
const PermissionTreeAPIPrivate = new API(PERMISSION_TREE_API_PRIVATE_URL, {
  'Content-Type': 'application/json',
})

const PermissionTreeAPIPublic = new API(
  get(getConfig(), 'publicRuntimeConfig.PERMISSION_TREE_API_PUBLIC_URL'),
  {
    'Content-Type': 'application/json',
  }
)

const GetPermissionTreeAPI = () =>
  process.browser ? PermissionTreeAPIPublic : PermissionTreeAPIPrivate

const getStats = () => GetPermissionTreeAPI().GET('/permission-tree/stats')

const getValidatorPermissionTree = (address) =>
  GetPermissionTreeAPI().GET(`/permission-tree/validator/${address}`)

const getValidators = () =>
  GetPermissionTreeAPI().GET('/permission-tree/validators')

const getMinerPermissionTree = (address) =>
  GetPermissionTreeAPI().GET(`/permission-tree/miner/${address}`)

const getMinerProofHistory = (address) =>
  GetPermissionTreeAPI().GET(`/epochs/proofs/${address}`)

const getEpochStats = (epoch) => GetPermissionTreeAPI().GET(`/epochs/${epoch}`)

const getEpochsStats = () => GetPermissionTreeAPI().GET(`/epochs`)

const getEpochProofSums = () => GetPermissionTreeAPI().GET('/epochs/proofs/sum')

const getEpochProofSum = (epoch) =>
  GetPermissionTreeAPI().GET(`/epochs/proofs/sum/${epoch}`)

const getEpochHistogram = (epoch) =>
  GetPermissionTreeAPI().GET(`/epochs/proofs/histogram/${epoch}`)

module.exports = {
  getStats,
  getValidatorPermissionTree,
  getValidators,
  getMinerPermissionTree,
  getMinerProofHistory,
  getEpochStats,
  getEpochsStats,
  getEpochProofSums,
  getEpochProofSum,
  getEpochHistogram,
}
