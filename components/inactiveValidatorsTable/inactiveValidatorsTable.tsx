import { Table, Tooltip } from 'antd'
import { PermissionNodeValidator } from '../../lib/types/0l'
import classes from './inactiveValidatorsTable.module.scss'
import { ReactNode, useEffect, useState } from 'react'
import { Sorter, PROOFS_THRESHOLD } from '../../lib/utils'
import { get } from 'lodash'
import API from '../../lib/api/local'
import BoolIcon from '../boolIcon/boolIcon'

interface InactiveValidatorsTableProps {
  validators: PermissionNodeValidator[]
  validatorsMap: Map<string, PermissionNodeValidator>
  top?: ReactNode | undefined
  bottom?: ReactNode | undefined
}

const InactiveValidatorsTable = ({
  validators,
  validatorsMap,
  top,
  bottom,
}: InactiveValidatorsTableProps) => {

  const [towerMap, setTowerMap] = useState({})

  const getInactiveStats = async () => {
    const inactiveRes = await API.POST('/tower/inactive', validators.map(val => val.address))
    if (inactiveRes.status !== 200) return
    setTowerMap(inactiveRes.data)
  }

  useEffect(() => {
    getInactiveStats()
  }, [])

  const ValidatorColumns = [
    { key: 'number', title: '#', width: 60, render: (_, __, i) => `${i + 1}` },
    {
      key: 'address',
      dataIndex: 'address',
      width: 300,
      title: 'Account',
      render: (text) => <a href={`/address/${text}`}>{text.toUpperCase()}</a>,
    },
    {
      key: 'count_proofs_in_epoch',
      title: 'Proofs in Epoch',
      sorter: Sorter(
        (record: PermissionNodeValidator) => get(towerMap, `[${record.address}].actual_count_proofs_in_epoch`, 0)
      ),
      width: 150,
      render: (_, record) =>{
        const count_proofs_in_epoch = get(towerMap, `[${record.address}].actual_count_proofs_in_epoch`)
        if (count_proofs_in_epoch === undefined) return ''

        const metThreshold = count_proofs_in_epoch > PROOFS_THRESHOLD
        return (
          <Tooltip title={metThreshold ? `Submitted more than the threshold of ${PROOFS_THRESHOLD} proofs in the current epoch. Will be able to enter the active validator set at the start of the next epoch`: `Must submit ${PROOFS_THRESHOLD - count_proofs_in_epoch + 1} more proof${PROOFS_THRESHOLD - count_proofs_in_epoch == 0 ? '' : 's'} in the current epoch to be able to enter the active validator set in the next epoch`}>
        <span>
          <BoolIcon condition={metThreshold}/>
          {count_proofs_in_epoch}
        </span>
        </Tooltip>
      )}
    },
    {
      key: 'verified_tower_height',
      title: 'Tower Height',
      sorter: Sorter((record: PermissionNodeValidator) => get(towerMap, `[${record.address}].verified_tower_height`, 0)),
      width: 150,
      render: (_, record) => get(towerMap, `[${record.address}].verified_tower_height`, '')
    },
    {
      key: 'epoch_onboarded',
      title: 'Epoch Onboarded',
      width: 100,
      sorter: Sorter((record: PermissionNodeValidator) =>
        get(validatorsMap[record.address.toLowerCase()], 'epoch_onboarded')
      ),
      render: (_, record: PermissionNodeValidator) =>
        get(validatorsMap[record.address.toLowerCase()], 'epoch_onboarded'),
    },
  ]

  return (
    <div className={classes.tableContainer}>
      <div className={validators.length === 0 ? classes.innerEmpty : classes.inner}>
        {top}
        <Table
          rowKey="account_address"
          scroll={{ x: true }}
          columns={ValidatorColumns}
          dataSource={validators}
          pagination={false}
        />
        {bottom}
      </div>
    </div>
  )
}

export default InactiveValidatorsTable
