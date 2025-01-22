import { HighTable, Selection } from 'hightable'
import { useState } from 'react'
import { data } from './data'
import Layout from './Layout'

export default function SelectionPage() {
  const [selection, setSelection] = useState<Selection | undefined>(undefined)
  return <Layout>
    <section>
      Current selection: {JSON.stringify(selection)}
    </section>
    <HighTable data={data} onSelectionChange={setSelection} />
  </Layout>
}
