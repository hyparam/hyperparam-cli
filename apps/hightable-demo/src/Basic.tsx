import Layout from './Layout'

import { HighTable } from 'hightable'
import { data } from './data'

export default function Basic() {
  return <Layout>
    <HighTable data={data} />
  </Layout>
}
