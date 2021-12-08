import NavLayout from '../components/navLayout/navLayout'
import { List } from 'antd'
import { useEffect } from 'react'
import { pageview } from '../lib/gtag'

const DonatePage = () => {
  useEffect(() => {
    pageview('/donate', 'donate')
  })
  return (
    <NavLayout hideFooter>
      <h1 style={{ color: 'white' }}>Donation</h1>

      <List
        style={{ maxWidth: 700 }}
        bordered
        header={
          <h3 style={{ color: 'white' }}>
            If you would like to contribute to this project financially, please
            send to one of the following addresses:
          </h3>
        }
        dataSource={[
          '0L (GAS) - b3b77d203bf13c97626137b2ca9d981d',
          'Cosmos (ATOM) - cosmos1zq3r93gs6smvxvmflwwppe930p4wcrc7nwlcp0',
        ]}
        renderItem={(item, i) => (
          <List.Item>
            <span style={{ color: 'white' }} key={`donation_${i}`}>
              {item}
            </span>
          </List.Item>
        )}
      />
    </NavLayout>
  )
}

export default DonatePage
