import { createTableControl, HighTable, Selection } from 'hightable'
import { StrictMode, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { data } from './data'
import './HighTable.css'
import './index.css'

const app = document.getElementById('app')
if (!app) throw new Error('missing app element')

function App() {
  const tableControl = createTableControl()
  const columns = data.header

  const [columnId, setColumnId] = useState<number | undefined>()
  const [selection, setSelection] = useState<Selection>([])

  function onOrderByChange(orderBy: string | undefined) {
    console.log("New value for orderBy: " + orderBy)
    if (!orderBy) {
      setColumnId(undefined)
      return
    }
    const id = columns.indexOf(orderBy)
    if (id === -1) {
      setColumnId(undefined)
    }
    setColumnId(id)
  }
  function onSelectionChange(selection: Selection) {
    setSelection(selection)
  }

  function onSortClick() {
    const nextId = ((columnId ?? -1) + 1) % columns.length
    tableControl.setOrderBy(columns[nextId])
  }
  function onSelectionClick() {
    const newSelection = selection.map(({start, end}) => ({start: start + 1, end: end + 1}))
    tableControl.setSelection(newSelection)
  }
  function getSelectionCount(selection: Selection) {
    return selection.reduce((acc: number, {start, end}) => acc + end - start, 0)
  }
  function getFirstRows(selection: Selection, max = 5) {
    const indexes: string[] = []
    let rangeIdx = 0
    while (indexes.length < max && rangeIdx < selection.length) {
      const {start, end} = selection[rangeIdx]
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

  return (<StrictMode>
    <div style={{display: 'flex', flexDirection: 'column', width: '100%'}}>
      <div style={{padding: '1em'}}>
        <h2>Hightable demo</h2>

        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1em'}}>
        <div style={{padding: '1em', border: '1px solid #ccc'}}>
            <h3>Order by</h3>
            <p>Click the button to sort the table by the next column</p>
            <button onClick={onSortClick}>Sort the following column</button>
            <p>Column ID: {columnId}</p>
            <p>{columnId === undefined ? 'No sorted column': ('Column name: "' + columns[columnId] + '"')}</p>
          </div>
          <div style={{padding: '1em', border: '1px solid #ccc'}}>
            <h3>Rows selection</h3>
            <p>Click the button to delete the selected rows</p>
            <button onClick={onSelectionClick}>Move the selection down by one row</button>
            <p>selection: <code style={{margin: '0.5em', padding: '0.2em 0.5em', backgroundColor: '#ddd'}}>{JSON.stringify(selection)}</code></p>
            <p>{getSelectionCount(selection)} selected rows: {getFirstRows(selection).map(index => <code style={{margin: '0.5em', padding: '0.2em 0.5em', backgroundColor: '#ddd'}}>{index}</code>)}</p>
          </div>
        </div>
      </div>
      <HighTable data={data} cacheKey='demo' selectable tableControl={tableControl} onOrderByChange={onOrderByChange} onSelectionChange={onSelectionChange} />
    </div>
  </StrictMode>)
}

ReactDOM.createRoot(app).render(<App></App>)
