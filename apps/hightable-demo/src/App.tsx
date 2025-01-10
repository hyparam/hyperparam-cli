import { ControlledHighTable, HighTable, InternalAction, InternalState, Selection, SelectionAndAnchor, initialState, reducer } from 'hightable'
import { StrictMode, useMemo, useReducer, useState } from 'react'
import { data } from './data'
import './HighTable.css'
import './index.css'

type State = InternalState & SelectionAndAnchor

type Action = InternalAction
  | ({ type: 'SET_SELECTION' } & SelectionAndAnchor)

// for demo purpose
function appReducer(state: State, action: Action): State {
  switch (action.type) {
  case 'SET_SELECTION':
    // do something special for the "SET_SELECTION" action
    console.log('SET_SELECTION', action.selection)
    return { ...state, selection: action.selection, anchor: action.anchor }
  default:
    // use the hightable reducer function for the rest of the actions
    return reducer(state, action)
  }
}

export default function App() {
  const columns = data.header

  const [state, dispatch] = useReducer(appReducer, initialState)
  const [selectable, setSelectable] = useState(false)

  const selectionAndAnchor = selectable ? { selection: state.selection, anchor: state.anchor } : undefined
  const setSelectionAndAnchor = selectable ? (selectionAndAnchor: SelectionAndAnchor) => { dispatch({ type: 'SET_SELECTION', ...selectionAndAnchor }) } : undefined

  function onSelectionChange(selection: Selection) {
    dispatch({ type: 'SET_SELECTION', selection })
  }

  const { selection, orderBy } = state
  const columnId = useMemo(() => {
    if (!orderBy) return undefined
    const id = columns.indexOf(orderBy)
    return id === -1 ? undefined : id
  }, [columns, orderBy])

  function onSortClick() {
    const nextId = ((columnId ?? -1) + 1) % columns.length
    dispatch({ type: 'SET_ORDER', orderBy: columns[nextId] })
  }
  function onSelectionClick() {
    const newSelection = selection.map(({ start, end }) => ({ start: start + 1, end: end + 1 }))
    dispatch({ type: 'SET_SELECTION', selection: newSelection, anchor: undefined })
  }
  function getSelectionCount(selection: Selection) {
    return selection.reduce((acc: number, { start, end }) => acc + end - start, 0)
  }
  function getFirstRows(selection: Selection, max = 5) {
    const indexes: string[] = []
    let rangeIdx = 0
    while (indexes.length < max && rangeIdx < selection.length) {
      const { start, end } = selection[rangeIdx]
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
        <h2 >Hightable</h2>
        {selectable && <p>The selection is enabled because onSelectionChange is set.</p>}
        {!selectable && <p>The selection is disabled because onSelectionChange is undefined.</p>}
        <button onClick={() => { setSelectable(selectable => !selectable) }}>{selectable ? 'Disable' : 'Enable'} selection</button>
      </div>
      <HighTable data={data} cacheKey='demo' onSelectionChange={selectable ? onSelectionChange : undefined} />
      <div style={{ padding: '0 1em 1em', borderTop: '1px solid #ccc' }}>
        <h2 >ControlledHightable</h2>
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
                <button onClick={onSelectionClick}>Move the selection down by one row</button>
                <p>selection: <code style={{ margin: '0.5em', padding: '0.2em 0.5em', backgroundColor: '#ddd' }}>{JSON.stringify(selection)}</code></p>
                <p>{getSelectionCount(selection)} selected rows: {getFirstRows(selection).map(index => <code key={index} style={{ margin: '0.5em', padding: '0.2em 0.5em', backgroundColor: '#ddd' }}>{index}</code>)}</p>
              </>}
            </div>
          </div>
        </div>
      </div>
      <ControlledHighTable data={data} cacheKey='demo' state={state} dispatch={dispatch} selectionAndAnchor={selectionAndAnchor} setSelectionAndAnchor={setSelectionAndAnchor} />
    </div>
  </StrictMode>
}
