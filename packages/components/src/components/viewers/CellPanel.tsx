import { DataFrame, asyncRows, stringify } from 'hightable'
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
        const rows = df.rows(row, row + 1)
        // Convert to AsyncRows
        const asyncRow = asyncRows(rows, 1, df.header)[0]
        // Await cell data
        const text = await asyncRow[df.header[col]].then(stringify)
        setText(text)
      } catch (error) {
        setError(error as Error)
      } finally {
        setProgress(1)
      }
    }

    loadCellData().catch(() => undefined)
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
