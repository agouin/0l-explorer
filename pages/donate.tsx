import NavLayout from '../components/navLayout/navLayout'
import { List } from 'antd'

const DonatePage = () => {
  return <NavLayout hideFooter>
    <h1 style={{ color: 'white' }}>Donation</h1>
    
    <List style={{ maxWidth: 700 }} bordered header={<h3 style={{ color: 'white' }}>If you would like to contribute to this project financially, please send to one of the following addresses:</h3>} dataSource={[
'0L (GAS) - 4be425e5306776a0bd9e2db152b856e6',
'Cosmos (ATOM) - cosmos1zq3r93gs6smvxvmflwwppe930p4wcrc7nwlcp0'
    ]} renderItem={(item, i) => <List.Item><span style={{ color: 'white' }} key={`donation_${i}`}>{item}</span></List.Item>}/>
    
  </NavLayout>
}

export default DonatePage