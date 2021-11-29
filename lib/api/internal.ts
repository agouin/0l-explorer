import API from './index'
import getTypescriptAPI from '../types/api'

export default getTypescriptAPI(new API('http://localhost:3027', { 'Content-Type': 'application/json' }))
