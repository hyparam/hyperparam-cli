import { FileKey, UrlKey, parquetDataFrame } from '@hyparam/utils'
import { asyncRows } from 'hightable'
import { asyncBufferFromUrl, parquetMetadataAsync } from 'hyparquet'
import { useEffect, useState } from 'react'
import Breadcrumb from './Breadcrumb.js'
import Layout from './Layout.js'

interface CellProps {
  parsedKey: FileKey | UrlKey;
  row: number;
  col: number;
}

enum LoadingState {
  NotLoaded,
  Loading,
  Loaded,
}

/**
 * Cell viewer displays a single cell from a table.
 */
export default function CellView({ parsedKey, row, col }: CellProps) {
  const [loading, setLoading] = useState<LoadingState>(LoadingState.NotLoaded)
  const [text, setText] = useState<string | undefined>()
  const [progress, setProgress] = useState<number>()
  const [error, setError] = useState<Error>()

  // File path from url
  const { resolveUrl, fileName } = parsedKey

  // Load cell data
  useEffect(() => {
    async function loadCellData() {
      try {
        // TODO: handle first row > 100kb
        setProgress(0.25)
        const asyncBuffer = await asyncBufferFromUrl({ url: resolveUrl })
        const from = { url: resolveUrl, byteLength: asyncBuffer.byteLength }
        setProgress(0.5)
        const metadata = await parquetMetadataAsync(asyncBuffer)
        setProgress(0.75)
        const df = parquetDataFrame(from, metadata)
        const rows = df.rows(row, row + 1)
        // Convert to AsyncRows
        const asyncRow = asyncRows(rows, 1, df.header)[0]
        // Await cell data
        const text = await asyncRow[df.header[col]].then(stringify)
        setText(text)
        setError(undefined)
      } catch (error) {
        setError(error as Error)
        setText(undefined)
      } finally {
        setLoading(LoadingState.Loaded)
        setProgress(undefined)
      }
    }

    if (loading === LoadingState.NotLoaded) {
      // use loading state to ensure we only load content once
      setLoading(LoadingState.Loading)
      loadCellData().catch(() => undefined)
    }
  }, [resolveUrl, col, row, loading, setError])

  return (
    <Layout progress={progress} error={error} title={fileName}>
      <Breadcrumb parsedKey={parsedKey} />

      {/* <Highlight text={text || ''} /> */}
      <pre className="viewer text">{text}</pre>
    </Layout>
  )
}

/**
 * Robust stringification of any value, including json and bigints.
 */
function stringify(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return value.toLocaleString('en-US')
  if (Array.isArray(value)) {
    return `[\n${value.map((v) => indent(stringify(v), 2)).join(',\n')}\n]`
  }
  if (value === null || value === undefined) return JSON.stringify(value)
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'object') {
    return `{${Object.entries(value)
      .filter((d) => d[1] !== undefined)
      .map(([k, v]) => `${k}: ${stringify(v)}`)
      .join(', ')}}`
  }
  return '{}'
}

function indent(text: string | undefined, spaces: number) {
  return text
    ?.split('\n')
    .map((line) => ' '.repeat(spaces) + line)
    .join('\n')
}
