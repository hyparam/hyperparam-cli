import { stringify } from 'hightable'
import { asyncBufferFromUrl, parquetMetadataAsync } from 'hyparquet'
import { useEffect, useState } from 'react'
import { useConfig } from '../../hooks/useConfig.js'
import type { FileSource } from '../../lib/sources/types.js'
import { parquetDataFrame } from '../../lib/tableProvider.js'
import { cn } from '../../lib/utils.js'
import Breadcrumb from '../Breadcrumb/Breadcrumb.js'
import Layout from '../Layout/Layout.js'
import styles from '../TextView/TextView.module.css'

interface CellProps {
  source: FileSource
  row: number
  col: number
}

const UNLOADED_CELL_PLACEHOLDER = '<the content has not been fetched yet>'

/**
 * Cell viewer displays a single cell from a table.
 */
export default function CellView({ source, row, col }: CellProps) {
  const [text, setText] = useState<string | undefined>()
  const [progress, setProgress] = useState<number>()
  const [error, setError] = useState<Error>()
  const { customClass } = useConfig()

  // File path from url
  const { resolveUrl, requestInit, fileName } = source

  // Load cell data
  useEffect(() => {
    async function loadCellData() {
      try {
        // TODO: handle first row > 100kb
        setProgress(0.25)
        const asyncBuffer = await asyncBufferFromUrl({ url: resolveUrl, requestInit })
        const from = { url: resolveUrl, requestInit, byteLength: asyncBuffer.byteLength }
        setProgress(0.5)
        const metadata = await parquetMetadataAsync(asyncBuffer)
        setProgress(0.75)
        const df = parquetDataFrame(from, metadata)

        const columnName = df.header[col]
        if (columnName === undefined) {
          throw new Error(`Column name missing at index col=${col}`)
        }
        await df.fetch({ rowStart: row, rowEnd: row + 1, columns: [columnName] })
        const cell = df.getCell({ row, column: columnName })
        const text = cell === undefined ? UNLOADED_CELL_PLACEHOLDER : stringify(cell.value)
        setText(text)
        setError(undefined)
      } catch (error) {
        setError(error as Error)
        setText(undefined)
      } finally {
        setProgress(undefined)
      }
    }

    setProgress(0)
    void loadCellData()
  }, [resolveUrl, requestInit, col, row])

  return (
    <Layout progress={progress} error={error} title={fileName}>
      <Breadcrumb source={source} />

      {/* <Highlight text={text || ''} /> */}
      <pre className={cn(styles.textView, customClass?.textView)}>{text}</pre>
    </Layout>
  )
}
