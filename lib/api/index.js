const axios = require('axios')

module.exports = class API {
  host = null
  defaultHeaders = {}
  httpsAgent = null
  postProcessing = null

  constructor(host, defaultHeaders, httpsAgent, postProcessing) {
    this.host = host
    this.defaultHeaders = defaultHeaders
    this.httpsAgent = httpsAgent
    this.postProcessing = postProcessing
  }

  request = async (method, route, body, headers, config, query, ctx) => {
    const url = this.host + route
    const options = {
      url,
      params: query,
      method,
      headers: { ...this.defaultHeaders, ...headers },
      ...(body && { data: body }),
      ...(this.httpsAgent && { httpsAgent: this.httpsAgent }),
      validateStatus: false,
      ...config,
    }

    const response = await axios(options)
    if (this.postProcessing) await this.postProcessing(response, options)

    if (response.status !== 200) console.log('Response error', response.status)

    return response
  }

  GET = async (route, query, headers, config) => await this.request('GET', route, null, headers, config, query)
  POST = async (route, body, headers, config) => await this.request('POST', route, body, headers, config, null)
  PATCH = async (route, body, headers, config) => await this.request('PATCH', route, body, headers, config, null)
  PUT = async (route, body, headers, config) => await this.request('PUT', route, body, headers, config, null)
  DELETE = async (route, body, headers, config) => await this.request('DELETE', route, body, headers, config, null)
}
