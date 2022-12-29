const API = require('./index')

const { VALIDATOR_DIEM_PROMETHEUS_HOST } = process.env

const validatorDiemPromHosts = VALIDATOR_DIEM_PROMETHEUS_HOST.split(',')

const validatorPrometheusAPIs = []

for (const host of validatorDiemPromHosts) {
  validatorPrometheusAPIs.push(new API(`http://${host}:9101`))
}

const getCurrentConsensusRound = async () => {
  const promises = []
  for (const api of validatorPrometheusAPIs) {
    promises.push(new Promise(async (res)=> {
      try {
        const { data, status } = await api.GET('/counters')
        if (status !== 200) {
          console.log('Error fetching current round from validator prom', {host: api.host, status})
          res({ round: 0, epoch: 0})
        }
        res({ round: data.diem_consensus_current_round, epoch: data['diem_safety_rules_state.epoch'] })
      } catch (err) {
        console.error(err)
        res({ round: 0, epoch: 0})
      }
    }))
  }
  const res = await Promise.all(promises)
  const epochs = {}
  for (const resp of res) {
    if (!epochs[resp.epoch]) epochs[resp.epoch] = []
    epochs[resp.epoch].push(resp.round)
  }
  const maxEpoch = Math.max(...Object.keys(epochs))
  return Math.max(...epochs[maxEpoch])
}

module.exports = {
  getCurrentConsensusRound,
}
