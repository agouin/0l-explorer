const API = require('./index')

const { VALIDATOR_DIEM_PROMETHEUS_HOST } = process.env

const ValidatorPrometheusAPI = new API(
  `http://${VALIDATOR_DIEM_PROMETHEUS_HOST}:9101`
)

const getCurrentConsensusRound = async () => {
  try {
    const { data, status } = await ValidatorPrometheusAPI.GET('/counters')
    if (status !== 200) {
      return 1
    }
    return data.diem_consensus_current_round
  } catch (err) {
    console.error(err)
    return 1
  }
}

module.exports = {
  getCurrentConsensusRound,
}
