import { HighTable, OrderBy, Selection } from 'hightable'
import { useState } from 'react'
import Layout from './Layout'
import { data } from './data'

export default function App() {
  const [selection, setSelection] = useState<Selection>({ ranges: [] })
  const [orderBy, setOrderBy] = useState<OrderBy>({})

  return <Layout>
    <HighTable data={data} cacheKey='demo' onSelectionChange={setSelection} onOrderByChange={setOrderBy} />
    <HighTable data={data} cacheKey='demo' selection={selection} orderBy={orderBy} />
  </Layout>
}
