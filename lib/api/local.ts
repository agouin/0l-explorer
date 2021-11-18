import API from './index'
import getTypescriptAPI from '../types/api'

export default getTypescriptAPI(new API('', { 'Content-Type': 'application/json' }))
