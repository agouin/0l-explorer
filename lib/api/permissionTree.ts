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
import {
  getStats as getStatsJS,
  getValidatorPermissionTree as getValidatorPermissionTreeJS,
  getOperatorPermissionTree as getOperatorPermissionTreeJS,
  getValidators as getValidatorsJS,
  getMinerPermissionTree as getMinerPermissionTreeJS,
  getMinerProofHistory as getMinerProofHistoryJS,
  getEpochStats as getEpochStatsJS,
  getEpochsStats as getEpochsStatsJS,
  getEpochProofSums as getEpochProofSumsJS,
  getEpochProofSum as getEpochProofSumJS,
  getEpochHistogram as getEpochHistogramJS,
} from './permissionTree.js'

export const getStats = async (): Promise<AxiosResponse<StatsResponse>> =>
  getStatsJS()

export const getValidatorPermissionTree = async (
  address: string
): Promise<AxiosResponse<ValidatorPermissionTreeResponse>> =>
  getValidatorPermissionTreeJS(address)

export const getOperatorPermissionTree = async (
  address: string
): Promise<AxiosResponse<ValidatorPermissionTreeResponse>> =>
  getOperatorPermissionTreeJS(address)

export const getValidators = async (): Promise<
  AxiosResponse<PermissionNodeValidator[]>
> => getValidatorsJS()

export const getMinerPermissionTree = async (
  address: string
): Promise<AxiosResponse<MinerPermissionTreeResponse>> =>
  getMinerPermissionTreeJS(address)

export const getMinerProofHistory = async (
  address: string
): Promise<AxiosResponse<MinerEpochStatsResponse[]>> =>
  getMinerProofHistoryJS(address)

export const getEpochStats = async (
  epoch: number
): Promise<AxiosResponse<EpochStatsResponse>> => getEpochStatsJS(epoch)

export const getEpochsStats = async (): Promise<
  AxiosResponse<EpochStatsResponse[]>
> => getEpochsStatsJS()

export const getEpochProofSums = async (): Promise<
  AxiosResponse<EpochProofsResponse[]>
> => getEpochProofSumsJS()

export const getEpochProofSum = async (
  epoch: number
): Promise<AxiosResponse<EpochProofsResponse[]>> => getEpochProofSumJS(epoch)

export const getEpochHistogram = async (
  epoch: number
): Promise<AxiosResponse<EpochProofsHistogramResponse[]>> =>
  getEpochHistogramJS(epoch)
