import { AxiosRequestConfig, AxiosResponse } from 'axios'

export interface APIType {
  GET: (route: string, query?: object, headers?: object, config?: AxiosRequestConfig) => Promise<AxiosResponse>
  POST: (route: string, body?: object, headers?: object, config?: AxiosRequestConfig) => Promise<AxiosResponse>
  PATCH: (route: string, body?: object, headers?: object, config?: AxiosRequestConfig) => Promise<AxiosResponse>
  PUT: (route: string, body?: object, headers?: object, config?: AxiosRequestConfig) => Promise<AxiosResponse>
  DELETE: (route: string, body?: object, headers?: object, config?: AxiosRequestConfig) => Promise<AxiosResponse>
}

const getTypescriptAPI = (api) => api as APIType

export default getTypescriptAPI
