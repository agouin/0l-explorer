import Index, { getServerSideProps as indexGetServerSideProps } from './index'
import { GetServerSideProps } from 'next'

export const getServerSideProps: GetServerSideProps = (ctx) => indexGetServerSideProps({
    ...ctx,
    query: {
      ...ctx.query,
      tab: 'autoPay',
    }
  })

export default Index