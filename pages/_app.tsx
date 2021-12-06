import Head from 'next/head'
import { AppProps } from 'next/app'
import Script from 'next/script'
import 'antd/dist/antd.css'
import '../styles/global.scss'
import getConfig from 'next/config'
import { get } from 'lodash'

export default function App({ Component, pageProps }: AppProps) {
  const GA_MEASUREMENT_ID = get(getConfig(), 'publicRuntimeConfig.GA_MEASUREMENT_ID')
  return (
    <>
    <Head>
      <title>0L Explorer</title>
      <link rel="icon" type="image/x-icon" href="/favicon.ico?v=1"></link>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />
    </Head>
    <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script
        id="gtag-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `,
        }}
      />
    <Component {...pageProps} />
    </>
  )
}
