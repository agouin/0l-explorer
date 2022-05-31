const API = require('./index')

const { VALIDATOR_DIEM_PROMETHEUS_HOST } = process.env

const ValidatorPrometheusAPI = new API(
  `http://${VALIDATOR_DIEM_PROMETHEUS_HOST}:9101`
)

const getCurrentConsensusRound = async () => {
  try {
    const { data, status } = await ValidatorPrometheusAPI.GET('/metrics')
    console.log({ data, status })
    if (status !== 200) {
      return 1
    }
    const matches = data.match(/\ndiem_consensus_current_round\s+(\d+)\n/)
    if (!matches) {
      return 1
    }
    return parseInt(matches[1])
  } catch (err) {
    console.error(err)
    return 1
  }
}

module.exports = {
  getCurrentConsensusRound,
}
