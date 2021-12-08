import { Table, message, Spin } from 'antd'
import classes from './epochsTable.module.scss'
import { useState, useEffect, ReactNode, useRef } from 'react'
import API from '../../lib/api/local'
import { getEpochProofSums } from '../../lib/api/permissionTree'
import { get } from 'lodash'

interface Epoch {
  epoch: number
  height: number
}

const EpochsTable = ({
  top,
  currentEpoch,
  epochMinerStats,
}: {
  top?: ReactNode
  currentEpoch: number
  epochMinerStats: object
}) => {
  const [loading, setLoading] = useState(true)
  const [epochs, setEpochs] = useState<Epoch[]>([])

  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)

  const EpochsColumns = [
    {
      key: 'epoch',
      width: 70,
      title: 'Epoch',
      dataIndex: 'epoch',
    },
    {
      key: 'timestamp',
      width: 200,
      title: 'Timestamp',
      dataIndex: 'timestamp',
      render: (timestamp) =>
        timestamp ? new Date(timestamp * 1000).toLocaleString() : '',
    },
    {
      key: 'height',
      title: 'Height',
      dataIndex: 'height',
      width: 120,
      render: (height) => <a href={`/block/${height}`}>{height}</a>,
    },
    {
      key: 'miners',
      title: 'Miners',
      width: 120,
      render: (_, record) => get(epochMinerStats[record.epoch], 'miners') || '',
    },
    {
      key: 'proofs',
      title: 'Proofs',
      width: 120,
      render: (_, record) => get(epochMinerStats[record.epoch], 'proofs') || '',
    },
    {
      key: 'proofs_per_miner',
      title: '~Proofs/Miner',
      width: 120,
      render: (_, record) => {
        const proofs = get(epochMinerStats[record.epoch], 'proofs')
        if (!proofs) return ''
        const miners = get(epochMinerStats[record.epoch], 'miners')
        if (!miners) return ''
        return (proofs / miners).toFixed(1)
      },
    },
    {
      key: 'miners_payable',
      title: 'Miners Payable',
      width: 120,
      render: (_, record) => get(epochMinerStats[record.epoch], 'miners_payable') || '',
    },
    {
      key: 'miners_payable_proofs',
      title: 'Miners Payable Proofs',
      width: 120,
      render: (_, record) => get(epochMinerStats[record.epoch], 'miners_payable_proofs') || '',
    },
    {
      key: 'validator_proofs',
      title: 'Validator Proofs',
      width: 120,
      render: (_, record) => get(epochMinerStats[record.epoch], 'validator_proofs') || '',
    },
    {
      key: 'miner_payment_total',
      title: 'Miner Payment Total',
      width: 150,
      render: (_, record) => {
        const minerPaymentTotal = get(epochMinerStats[record.epoch], 'miner_payment_total')
        if (minerPaymentTotal === undefined || isNaN(minerPaymentTotal)) return ''
        return minerPaymentTotal/1000000
      }
    },
  ]

  const getEpochs = async (start, limit) => {
    setLoading(true)

    const epochsRes = await API.GET('/epochs', { start, limit })

    if (epochsRes.status !== 200) {
      message.error(`Error getting epochs: ${epochsRes.data}`)
      return
    }

    setEpochs(epochsRes.data.sort((a, b) => b.epoch - a.epoch))
    setLoading(false)
  }

  useEffect(() => {
    getEpochs(currentEpoch - pageSize, pageSize)
  }, [])

  const handleTableChange = (pagination, filters, sorter, { action }) => {
    console.log({ action, pagination, sorter })
    switch (action) {
      case 'paginate':
        const newPage = pagination.current
        const newPageSize = pagination.pageSize
        const newStart = currentEpoch - newPage * newPageSize
        const newLimit = newStart >= 0 ? newPageSize : newPageSize + newStart
        const start = Math.max(0, newStart)

        console.log({ newStart, newLimit, start })

        getEpochs(start, newLimit)
        setPage(newPage - 1)
        setPageSize(newPageSize)
        break
      default:
        break
    }
  }

  return (
    <div className={classes.tableContainer}>
      <div className={classes.inner}>
        {top}
        <Table
          rowKey="epoch"
          scroll={{ x: true }}
          columns={EpochsColumns}
          dataSource={epochs}
          onChange={handleTableChange}
          pagination={{
            position: ['bottomLeft'],
            current: page + 1,
            total: currentEpoch,
            pageSize,
          }}
        />
      </div>
      {loading && (
        <div className={classes.spinContainer}>
          <Spin />
        </div>
      )}
    </div>
  )
}

export default EpochsTable
