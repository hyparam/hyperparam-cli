import { stringify } from 'hightable'
import { asyncBufferFromUrl, parquetMetadataAsync } from 'hyparquet'
import { useEffect, useState } from 'react'
import type { FileSource } from '../../lib/sources/types.js'
import { parquetDataFrame } from '../../lib/tableProvider.js'
import Breadcrumb from '../Breadcrumb/Breadcrumb.js'
import Layout from '../Layout/Layout.js'

interface CellProps {
  source: FileSource
  row: number
  col: number
}

/**
 * Cell viewer displays a single cell from a table.
 */
export default function CellView({ source, row, col }: CellProps) {
  const [text, setText] = useState<string | undefined>()
  const [progress, setProgress] = useState<number>()
  const [error, setError] = useState<Error>()

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
      <pre className="viewer text">{text}</pre>
    </Layout>
  )
}
