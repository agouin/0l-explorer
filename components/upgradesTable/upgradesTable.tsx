import { Table, Tooltip, Row, Col } from 'antd'
import { Vitals } from '../../lib/types/0l'
import classes from './upgradesTable.module.scss'
import { ReactNode } from 'react'
import { isEqual } from 'lodash'

interface UpgradesTableProps {
  vitals: Vitals
  top?: ReactNode | undefined
  bottom?: ReactNode | undefined
}

const UpgradesTable = ({ vitals, top, bottom }: UpgradesTableProps) => {
  const getCurrentUpgradeConsensus = (votingVals) => {
    if (!vitals.chain_view.upgrade) return null
    let totalVotingPower = 0
    for (const validator of vitals.chain_view.validator_view) {
      totalVotingPower += validator.voting_power
    }
    let totalWeight = 0
    for (const vote of votingVals) {
      totalWeight += vote.weight
    }
    const percentage = (100.0 * totalWeight) / totalVotingPower

    return (
      <span>
        {totalWeight}/{totalVotingPower} (
        <span
          style={{
            color: percentage > 200.0 / 3.0 ? '#449800' : '#b10101',
          }}>
          {percentage.toFixed(2)}%
        </span>
        )
      </span>
    )
  }

  return (
    <div className={classes.container}>
      {vitals.chain_view.upgrade.upgrade.vote_counts.map((proposal, i) => {
        const votingVals = vitals.chain_view.upgrade.upgrade.votes.filter(
          (vote) => {
            console.log({ voteData: vote.data, proposalData: proposal.hash })
            return isEqual(vote.data, proposal.hash)
          }
        )
        return (
          <div className={classes.proposal}>
            <div className={classes.topStats}>
              <div className={classes.topStatsInner}>
                <p>Proposal {i + 1}</p>
                <div className={classes.infoRow}>
                  <Tooltip title="Hash of proposed stdlib binary">
                    <span className={classes.infoText}>
                      Hash:{' '}
                      <span className={classes.thinText}>
                        {proposal.hash.map((x) => x.toString(16)).join('')}
                      </span>
                    </span>
                  </Tooltip>
                </div>
                <div className={classes.infoRow}>
                  <Tooltip title="Current consensus (voted voting power out of total validator voting power)">
                    <span className={classes.infoText}>
                      Consensus:{' '}
                      <span className={classes.thinText}>
                        {getCurrentUpgradeConsensus(votingVals)}
                      </span>
                    </span>
                  </Tooltip>
                </div>
              </div>
            </div>
            <>
              <div className={classes.tableContainer}>
                <div className={classes.inner}>
                  {top}
                  <Table
                    dataSource={votingVals}
                    columns={[
                      {
                        dataIndex: 'validator',
                        title: 'Validator',
                        width: 300,
                        render: (address) => (
                          <a href={`/address/${address}`}>{address}</a>
                        ),
                      },
                      { dataIndex: 'weight', width: 100, title: 'Weight' },
                    ]}
                    pagination={false}
                  />
                  {bottom}
                </div>
              </div>
            </>
          </div>
        )
      })}
    </div>
  )
}

export default UpgradesTable
