import NavLayout from '../components/navLayout/navLayout'
import { useEffect } from 'react'
import { pageview } from '../lib/gtag'

const NotFoundPage = () => {
  useEffect(() => {
    pageview('/404', '404')
  }, [])

  return (
    <NavLayout>
      <h1 style={{ color: 'white' }}>404: Not found</h1>
    </NavLayout>
  )
}

export default NotFoundPage
