import { DataFrame, stringify } from 'hightable'
import { useEffect, useState } from 'react'
import ContentHeader from './ContentHeader.js'

interface ViewerProps {
  df: DataFrame
  row: number
  col: number
  setProgress: (progress: number) => void
  setError: (error: Error) => void
  onClose: () => void
}

/**
 * Cell viewer displays a single cell from a table.
 */
export default function CellPanel({ df, row, col, setProgress, setError, onClose }: ViewerProps) {
  const [text, setText] = useState<string | undefined>()

  // Load cell data
  useEffect(() => {
    async function loadCellData() {
      try {
        setProgress(0.5)
        const asyncRows = df.rows({ start: row, end: row + 1 })
        if (asyncRows.length !== 1) {
          throw new Error(`Expected 1 row, got ${asyncRows.length}`)
        }
        const asyncRow = asyncRows[0]
        // Await cell data
        const text = await asyncRow.cells[df.header[col]].then(stringify)
        setText(text)
      } catch (error) {
        setError(error as Error)
      } finally {
        setProgress(1)
      }
    }

    void loadCellData()
  }, [df, col, row, setProgress, setError])

  const headers = <>
    <button className="slideClose" onClick={onClose}>&nbsp;</button>
    <span>column `{df.header[col]}`</span>
    <span>row {row + 1}</span>
  </>

  return <ContentHeader headers={headers}>
    <code className="text">{text}</code>
  </ContentHeader>
}
