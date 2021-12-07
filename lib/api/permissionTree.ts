import getTypescriptAPI from '../types/api'
import API from '../api/index'
import { AxiosResponse } from 'axios'
import {
  StatsResponse,
  ValidatorPermissionTreeResponse,
  MinerPermissionTreeResponse,
  MinerEpochStatsResponse,
  EpochProofsResponse,
} from '../types/0l'

const { PERMISSION_TREE_API_URL } = process.env

const PermissionTreeAPI = getTypescriptAPI(
  new API(PERMISSION_TREE_API_URL, { 'Content-Type': 'application/json' })
)

export const getStats = async (): Promise<AxiosResponse<StatsResponse>> =>
  await PermissionTreeAPI.GET('/permission-tree/stats')

export const getValidatorPermissionTree = async (
  address: string
): Promise<AxiosResponse<ValidatorPermissionTreeResponse>> =>
  await PermissionTreeAPI.GET(`/permission-tree/validator/${address}`)

export const getMinerPermissionTree = async (
  address: string
): Promise<AxiosResponse<MinerPermissionTreeResponse>> =>
  await PermissionTreeAPI.GET(`/permission-tree/miner/${address}`)

export const getMinerProofHistory = async (
  address: string
): Promise<AxiosResponse<MinerEpochStatsResponse[]>> =>
  await PermissionTreeAPI.GET(`/epochs/proofs/${address}`)

export const getEpochProofSums = async (): Promise<
  AxiosResponse<EpochProofsResponse[]>
> => await PermissionTreeAPI.GET('/epochs/proofs/sum')

export default PermissionTreeAPI
