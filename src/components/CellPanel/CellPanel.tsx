import { DataFrame, stringify } from 'hightable'
import { ReactNode, useEffect, useState } from 'react'
import { useConfig } from '../../hooks/useConfig.js'
import { cn } from '../../lib/utils.js'
import ContentWrapper from '../ContentWrapper/ContentWrapper.js'
import Json from '../Json/Json.js'
import jsonStyles from '../Json/Json.module.css'
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

const UNLOADED_CELL_PLACEHOLDER = '<the content has not been fetched yet>'

/**
 * Cell viewer displays a single cell from a table.
 */
export default function CellPanel({ df, row, col, setProgress, setError, onClose }: ViewerProps) {
  const [content, setContent] = useState<ReactNode>()
  const { customClass } = useConfig()

  // Load cell data
  useEffect(() => {
    async function loadCellData() {
      try {
        setProgress(0.5)

        const columnName = df.header[col]
        if (columnName === undefined) {
          throw new Error(`Column name missing at index col=${col}`)
        }
        await df.fetch({ rowStart: row, rowEnd: row + 1, columns: [columnName] })
        const cell = df.getCell({ row, column: columnName })
        if (cell === undefined) {
          setContent(
            <code className={cn(jsonStyles.textView, customClass?.textView)}>
              {/* TODO(SL) maybe change the style to highlight it's not real content */}
              {UNLOADED_CELL_PLACEHOLDER}
            </code>
          )
          return
        }
        const value: unknown = await cell.value
        if (value instanceof Object && !(value instanceof Date)) {
          setContent(
            <code className={cn(jsonStyles.jsonView, customClass?.jsonView)}>
              <Json json={value} />
            </code>
          )
        } else {
          setContent(
            <code className={cn(styles.textView, customClass?.textView)}>
              {stringify(value)}
            </code>
          )
        }
      } catch (error) {
        setError(error as Error)
      } finally {
        setProgress(1)
      }
    }

    void loadCellData()
  }, [df, col, row, setProgress, setError, customClass])

  const headers = <>
    <SlideCloseButton onClick={onClose} />
    <span>column: {df.header[col]}</span>
    <span>row: {row + 1}</span>
  </>

  return <ContentWrapper headers={headers}>
    {content}
  </ContentWrapper>
}
