import { HighTable, OrderBy, Selection } from 'hightable'
import { StrictMode, useMemo, useState } from 'react'
import { data } from './data'

export default function App() {
  const columns = data.header

  const [selectable, setSelectable] = useState(true)
  const [selection, setSelection] = useState<Selection>({ ranges: [] })
  const [orderBy, setOrderBy] = useState<OrderBy>({})
  const { column } = orderBy

  const columnId = useMemo(() => {
    if (!column) return undefined
    const id = columns.indexOf(column)
    return id === -1 ? undefined : id
  }, [columns, column])

  function onSortClick() {
    const nextId = ((columnId ?? -1) + 1) % columns.length
    setOrderBy({ column: columns[nextId] })
  }
  function onSelectionIncrementClick() {
    const newSelection = {
      ranges: selection.ranges.map(({ start, end }) => ({ start: start + 1, end: end + 1 })),
      anchor: selection.anchor !== undefined ? selection.anchor + 1 : undefined,
    }
    setSelection(newSelection)
  }
  function getSelectionCount(selection: Selection) {
    return selection.ranges.reduce((acc: number, { start, end }) => acc + end - start, 0)
  }
  function getFirstRows(selection: Selection, max = 5) {
    const indexes: string[] = []
    let rangeIdx = 0
    while (indexes.length < max && rangeIdx < selection.ranges.length) {
      const { start, end } = selection.ranges[rangeIdx]
      let rowIdx = start
      while (indexes.length < max && rowIdx < end) {
        indexes.push(rowIdx.toString())
        rowIdx++
      }
      rangeIdx++
    }
    if (indexes.length === max) {
      indexes.pop()
      indexes.push('...')
    }
    return indexes
  }

  return <StrictMode>
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <div style={{ padding: '0 1em 1em' }}>
        <h2>Uncontrolled selection and sort in Hightable</h2>
        {selectable && <p>The rows selection in this table is enabled, and the component is &quot;uncontrolled&quot; (it has a local state).</p>}
        {!selectable && <p>The selection is disabled because onSelectionChange is undefined.</p>}
        <button onClick={() => { setSelectable(selectable => !selectable) }}>{selectable ? 'Disable' : 'Enable'} selection</button>
      </div>
      <HighTable data={data} cacheKey='demo' onSelectionChange={selectable ? setSelection : undefined} />
      <div style={{ padding: '0 1em 1em', borderTop: '1px solid #ccc' }}>
        <h2>Controlled selection and sort in Hightable</h2>
        <div style={{ padding: '0 1em', marginBottom: '1em' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1em' }}>
            <div style={{ padding: '0 1em', border: '1px solid #ccc' }}>
              <h3>Order by</h3>
              <p>Column sort in ControlledHightable is controlled internally by clicking the column headers, and externally by the following button:</p>
              <button onClick={onSortClick}>Sort the following column</button>
              <p>{columnId === undefined ? 'No sorted column' : 'Sorted by: "' + columns[columnId] + '"'}</p>
            </div>
            <div style={{ padding: '0 1em', border: '1px solid #ccc' }}>
              <h3>Rows selection</h3>
              {!selectable && <p>The selection is disabled</p>}
              {selectable && <>
                <p>The selection is controlled internally by (shift) clicking the left column, and externally by mirroring changes from HighTable and by the following button:</p>
                <button onClick={onSelectionIncrementClick}>Move the selection down by one row</button>
                <p>selection: <code style={{ margin: '0.5em', padding: '0.2em 0.5em', backgroundColor: '#ddd' }}>{JSON.stringify(selection)}</code></p>
                <p>{getSelectionCount(selection)} selected rows: {getFirstRows(selection).map(index => <code key={index} style={{ margin: '0.5em', padding: '0.2em 0.5em', backgroundColor: '#ddd' }}>{index}</code>)}</p>
              </>}
            </div>
          </div>
        </div>
      </div>
      <HighTable data={data} cacheKey='demo' selection={selection} onSelectionChange={selectable ? setSelection : undefined} orderBy={orderBy} onOrderByChange={setOrderBy} />
    </div>
  </StrictMode>
}
