import { GetServerSideProps } from 'next'
import NotFoundPage from '../404'
import NavLayout from '../../components/navLayout/navLayout'
import classes from './epoch.module.scss'
import {
  getEpochProofSum,
  getEpochHistogram,
} from '../../lib/api/permissionTree'
import {
  EpochProofsResponse,
  EpochProofsHistogramResponse,
} from '../../lib/types/0l'
import { Table, Row, Col } from 'antd'
import { capitalCase } from 'change-case'
import Chart from 'react-google-charts'

interface EpochPageProps {
  epoch: number
  proofStats: EpochProofsResponse
  proofHistogram: EpochProofsHistogramResponse[]
}

const EpochPage = ({ epoch, proofStats, proofHistogram }: EpochPageProps) => {
  if (epoch === null) return NotFoundPage()

  return (
    <NavLayout>
      <div className={classes.outerContainer}>
        <Row>
          <Col>
            <h1 className={classes.title}>Epoch {epoch}</h1>
            <Table
              pagination={false}
              columns={[
                {
                  dataIndex: 'key',
                  title: 'Key',
                  render: (key) => capitalCase(key),
                },
                {
                  dataIndex: 'value',
                  title: 'Value',
                  render: (value, record) =>
                    record.key === 'miner_payment_total'
                      ? value / 1000000
                      : value,
                },
              ]}
              dataSource={Object.keys(proofStats)
                .slice(1)
                .map((stat) => ({
                  key: stat,
                  value: proofStats[stat],
                }))}
            />
          </Col>
          <Col>
            <div className={classes.chartContainer}>
              <Chart
                width={'800px'}
                height={'550px'}
                chartType="ColumnChart"
                loader={<div>Loading Chart</div>}
                data={[
                  ['Miner Proofs', 'Count', { role: 'style' }],
                  ...proofHistogram.map((point) => [
                    point.proofs,
                    point.count,
                    point.proofs <= 7 ?  '#b10101': '#449800',
                  ]),
                ]}
                options={{
                  title: 'Miner Proofs',
                  titleTextStyle: {
                    color: 'white',
                    fontSize: '20',
                  },
                  backgroundColor: 'transparent',
                  legend: 'none',
                  vAxis: {
                    title: 'Number of Miners',
                    titleTextStyle: {
                      color: 'white',
                      fontSize: 16,
                    },
                    gridlines: {
                      color: '#001a14',
                      minSpacing: 40,
                    },
                    minorGridlines: {
                      color: '#001f18',
                    },
                    textStyle: { color: 'white' },
                  },
                  hAxis: {
                    title: 'Proofs Submitted',
                    titleTextStyle: {
                      fontSize: 16,
                      color: 'white',
                    },
                    baselineColor: '#999999',
                    gridlines: {
                      color: '#001a14',
                      minSpacing: 40,
                    },
                    minorGridlines: {
                      color: '#001f18',
                    },
                    textStyle: { color: 'white' },
                  },
                }}
              />
            </div>
          </Col>
        </Row>
      </div>
    </NavLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { epoch: epochParam } = ctx.params
  const epochSingle = Array.isArray(epochParam) ? epochParam[0] : epochParam
  const epoch = parseInt(epochSingle)
  const { data: proofStats, status: proofStatus } = await getEpochProofSum(
    epoch
  )
  const {
    data: proofHistogram,
    status: histogramStatus,
  } = await getEpochHistogram(epoch)

  return {
    props: {
      epoch,
      proofStats,
      proofHistogram,
    },
  }
}

export default EpochPage
