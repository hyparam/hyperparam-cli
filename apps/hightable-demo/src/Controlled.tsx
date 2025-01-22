import { HighTable, OrderBy, Selection } from 'hightable'
import { useState } from 'react'
import { data } from './data'
import Layout from './Layout'

function createRandomSelection(): Selection {
  const maxStep = 8
  const maxLength = 5
  const minRanges = 1
  const maxRanges = 5
  const numRanges = Math.floor(Math.random() * (maxRanges - minRanges + 1) + minRanges)
  const ranges = []
  let start = 0
  for (let i = 0; i < numRanges; i++) {
    const length = Math.floor(Math.random() * maxLength + 1)
    const step = Math.floor(Math.random() * maxStep + 1)
    start += step
    const end = start + length
    ranges.push({ start, end })
    start = end
  }
  return { ranges }
}

function createRandomOrderBy(): OrderBy {
  const columns = data.header
  const column = columns[Math.floor(Math.random() * columns.length)]
  return { column }
}

function getNumSelected(selection: Selection): number {
  return selection.ranges.reduce((acc, range) => acc + (range.end - range.start), 0)
}

export default function Controlled() {
  const [selection, setSelection] = useState<Selection>({ ranges: [] })
  const [orderBy, setOrderBy] = useState<OrderBy>({})

  const numSelectedRows = getNumSelected(selection)

  return <Layout>
    <div>{/*  <- to collapse margins */}
      <section>
        <button onClick={() => { setSelection(createRandomSelection()) }}>Set random selection</button>
        <button onClick={() => { setSelection({ ranges: [] }) }}>Clear selection</button>
        <span>{numSelectedRows.toLocaleString('en-US')} selected {numSelectedRows === 1 ? 'row' : 'rows'}</span>
      </section>
      <section>
        <button onClick={() => { setOrderBy(createRandomOrderBy()) }}>Order by a random column</button>
        <button onClick={() => { setOrderBy({}) }}>Clear order</button>
        <span>{orderBy.column ? `Ordered by '${orderBy.column}'` : 'Unordered'}</span>
      </section>
    </div>
    <HighTable data={data} selection={selection} onSelectionChange={setSelection} orderBy={orderBy} onOrderByChange={setOrderBy} />
  </Layout>
}
