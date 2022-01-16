import getTypescriptAPI from '../types/api'
import API from '../api/index'
import { AxiosResponse } from 'axios'
import {
  StatsResponse,
  ValidatorPermissionTreeResponse,
  MinerPermissionTreeResponse,
  MinerEpochStatsResponse,
  EpochProofsResponse,
  EpochProofsHistogramResponse,
  PermissionNodeValidator,
  EpochStatsResponse,
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

export const getValidators = async (): Promise<
  AxiosResponse<PermissionNodeValidator[]>
> => await PermissionTreeAPI.GET('/permission-tree/validators')

export const getMinerPermissionTree = async (
  address: string
): Promise<AxiosResponse<MinerPermissionTreeResponse>> =>
  await PermissionTreeAPI.GET(`/permission-tree/miner/${address}`)

export const getMinerProofHistory = async (
  address: string
): Promise<AxiosResponse<MinerEpochStatsResponse[]>> =>
  await PermissionTreeAPI.GET(`/epochs/proofs/${address}`)

export const getEpochStats = async (epoch : number): Promise<AxiosResponse<EpochStatsResponse>> => await PermissionTreeAPI.GET(`/epochs/${epoch}`)

export const getEpochsStats = async (): Promise<AxiosResponse<EpochStatsResponse[]>> => await PermissionTreeAPI.GET(`/epochs`)

export const getEpochProofSums = async (): Promise<
  AxiosResponse<EpochProofsResponse[]>
> => await PermissionTreeAPI.GET('/epochs/proofs/sum')

export const getEpochProofSum = async (
  epoch: number
): Promise<AxiosResponse<EpochProofsResponse[]>> =>
  await PermissionTreeAPI.GET(`/epochs/proofs/sum/${epoch}`)

export const getEpochHistogram = async (
  epoch: number
): Promise<AxiosResponse<EpochProofsHistogramResponse[]>> =>
  await PermissionTreeAPI.GET(`/epochs/proofs/histogram/${epoch}`)

export default PermissionTreeAPI
