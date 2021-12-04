import Head from 'next/head'
import { AppProps } from 'next/app'
import 'antd/dist/antd.css'
import '../styles/global.scss'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
    <Head>
      <title>0L Explorer</title>
      <link rel="icon" type="image/x-icon" href="/favicon.ico?v=1"></link>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />
    </Head>
    <Component {...pageProps} />
    </>
  )
}
