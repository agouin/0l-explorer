import { ReactNode, useState } from 'react'
import { useRouter } from 'next/router'
import classes from './navLayout.module.scss'
import Search from 'antd/lib/input/Search'
import { Spin } from 'antd'

interface NavLayoutProps {
  children: ReactNode | undefined
  hideFooter?: boolean
}

const NavLayout = ({ children, hideFooter }: NavLayoutProps) => {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const go = (route) => {
    setLoading(true)
    window.location.href = route
  }

  const handleSearch = async (search) => {
    const normalizedSearch = search.trim()

    if (normalizedSearch.length === 64) {
      go(`/address/${normalizedSearch.substring(32)}`)
    } else if (normalizedSearch.length === 32) {
      go(`/address/${normalizedSearch}`)
    } else {
      const version = parseInt(normalizedSearch)
      if (!isNaN(version)) {
        go(`/block/${normalizedSearch}`)
      }
    }
  }

  const goHome = async () => {
    setLoading(true)
    await router.push(`/`)
    setLoading(false)
  }

  return (
    <div className={classes.full}>
      <div>
        <div className={classes.navBarContainer}>
          <div className={classes.homeLink} onClick={goHome}>
            <img className={classes.icon} src="/img/0L.png"/>
            <span className={classes.title}>0L Explorer</span>
          </div>
          <Search
            size="large"
            className={classes.search}
            placeholder="Enter an address, auth key, or block height"
            onSearch={handleSearch}></Search>
        </div>
        <div className={classes.content}>
          {children}
          {loading && (
            <div className={classes.spinContainer}>
              <Spin />
            </div>
          )}
        </div>
      </div>
      {!hideFooter && (
        <footer className={classes.footer}>
          <span className={classes.footerText}>
            If you would like to contribute to this project financially, please{' '}
            <a href="/donate"> donate</a>
          </span>
        </footer>
      )}
    </div>
  )
}

export default NavLayout
