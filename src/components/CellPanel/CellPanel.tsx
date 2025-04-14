import { DataFrame, stringify } from 'hightable'
import { useEffect, useState } from 'react'
import { useConfig } from '../../hooks/useConfig.js'
import { cn } from '../../lib/utils.js'
import ContentWrapper from '../ContentWrapper/ContentWrapper.js'
import SlideCloseButton from '../SlideCloseButton/SlideCloseButton.js'
import styles from '../TextView/TextView.module.css'

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
  const { customClass } = useConfig()

  // Load cell data
  useEffect(() => {
    async function loadCellData() {
      try {
        setProgress(0.5)
        const asyncRows = df.rows({ start: row, end: row + 1 })
        if (asyncRows.length > 1 || !(0 in asyncRows)) {
          throw new Error(`Expected 1 row, got ${asyncRows.length}`)
        }
        const asyncRow = asyncRows[0]
        // Await cell data
        const columnName = df.header[col]
        if (columnName === undefined) {
          throw new Error(`Column name missing at index col=${col}`)
        }
        const asyncCell = asyncRow.cells[columnName]
        if (asyncCell === undefined) {
          throw new Error(`Cell missing at column ${columnName}`)
        }
        const text = await asyncCell.then(stringify)
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
    <SlideCloseButton onClick={onClose} />
    <span>column `{df.header[col]}`</span>
    <span>row {row + 1}</span>
  </>

  return <ContentWrapper headers={headers}>
    <code className={cn(styles.textView, customClass?.textView)}>{text}</code>
  </ContentWrapper>
}
