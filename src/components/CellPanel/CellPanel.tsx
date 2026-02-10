import type { DataFrame } from 'hightable'
import { stringify } from 'hightable'
import { useEffect, useState } from 'react'
import { useConfig } from '../../hooks/useConfig.js'
import { cn } from '../../lib/utils.js'
import ContentWrapper from '../ContentWrapper/ContentWrapper.js'
import Dropdown from '../Dropdown/Dropdown.js'
import Json from '../Json/Json.js'
import jsonStyles from '../Json/Json.module.css'
import SlideCloseButton from '../SlideCloseButton/SlideCloseButton.js'
import styles from '../TextView/TextView.module.css'

interface ViewerProps {
  df: DataFrame
  row: number
  col: number
  setProgress: (progress: number) => void
  setError: (error: unknown) => void
  onClose: () => void
}

type Lens = 'text' | 'json'

/**
 * Cell viewer displays a single cell from a table.
 */
export default function CellPanel({ df, row, col, setProgress, setError, onClose }: ViewerProps) {
  const [value, setValue] = useState<unknown>()
  const [lens, setLens] = useState<Lens>('text')
  const [lensOptions, setLensOptions] = useState<Lens[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { customClass } = useConfig()

  // Load cell data
  useEffect(() => {
    async function loadCellData() {
      try {
        setProgress(0.5)
        setIsLoading(true)
        setLensOptions([])

        const columnName = df.columnDescriptors[col]?.name
        if (columnName === undefined) {
          throw new Error(`Column name missing at index col=${col}`)
        }
        let cell = df.getCell({ row, column: columnName })
        if (cell === undefined) {
          await df.fetch?.({ rowStart: row, rowEnd: row + 1, columns: [columnName] })
          cell = df.getCell({ row, column: columnName })
        }
        if (cell === undefined) {
          throw new Error(`Cell at row=${row}, column=${columnName} is undefined`)
        }

        // Parse string if valid JSON
        const value: unknown = attemptJSONParse(cell.value)

        const { options, defaultLens } = determineLensOptions(value)
        setLensOptions(options)
        setLens(defaultLens)
        setValue(value)
        setError(undefined)
      } catch (error) {
        setError(error as Error)
      } finally {
        setIsLoading(false)
        setProgress(1)
      }
    }

    void loadCellData()
  }, [df, col, row, setProgress, setError])

  const headers = <>
    <SlideCloseButton onClick={onClose} />
    <span>column: {df.columnDescriptors[col]?.name}</span>
    <span>row: {row + 1}</span>
    {lensOptions.length > 1 && <Dropdown label={lens} align='right'>
      {lensOptions.map(option =>
        <button key={option} onClick={() => { setLens(option) }}>
          {option}
        </button>
      )}
    </Dropdown>}
  </>

  let content
  if (isLoading) {
    content = undefined
  } else if (value instanceof Error) {
    content = <code className={cn(styles.textView, customClass?.textView)}>{value.name}: {value.message}</code>
  } else if (lens === 'json' && isJsonLike(value)) {
    content = <code className={cn(jsonStyles.jsonView, customClass?.jsonView)}><Json json={value} /></code>
  } else {
    content = <code className={cn(styles.textView, customClass?.textView)}>{stringify(value)}</code>
  }

  return <ContentWrapper headers={headers} isLoading={isLoading}>
    {content}
  </ContentWrapper>
}

function determineLensOptions(cellValue: unknown): { options: Lens[]; defaultLens: Lens } {
  if (isJsonLike(cellValue)) {
    return { options: ['json', 'text'], defaultLens: 'json' }
  }
  return { options: ['text'], defaultLens: 'text' }
}

function isJsonLike(cellValue: unknown): boolean {
  if (cellValue === null) return false
  if (cellValue instanceof Date) return false
  if (cellValue instanceof Error) return false
  return typeof cellValue === 'object'
}

function attemptJSONParse(value: unknown): unknown {
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value) as unknown
  } catch {
    return value
  }
}
