import HighTable, { DataFrame } from 'hightable'
import { FileMetaData } from 'hyparquet'
import { ReactNode, useState } from 'react'
import Dropdown from './Dropdown.js'
import ParquetLayout from './ParquetLayout.js'
import ParquetMetadata from './ParquetMetadata.js'

type Lens = 'table' | 'metadata' | 'layout'

export interface PageProps {
  metadata: FileMetaData
  df: DataFrame
  name: string
  byteLength?: number
  setError: (e: Error) => void
}

/**
 * Hyparquet demo viewer page
 * @param {Object} props
 * @returns {ReactNode}
 */
export default function Page({ metadata, df, name, byteLength, setError }: PageProps): ReactNode {
  const [lens, setLens] = useState<Lens>('table')

  return <>
    <div className='top-header'>{name}</div>
    <div className='view-header'>
      {byteLength !== undefined && <span title={byteLength.toLocaleString() + ' bytes'}>{formatFileSize(byteLength)}</span>}
      <span>{df.numRows.toLocaleString()} rows</span>
      <Dropdown label={lens}>
        <button onClick={() => { setLens('table') }}>Table</button>
        <button onClick={() => { setLens('metadata') }}>Metadata</button>
        {byteLength && <button onClick={() => { setLens('layout') }}>Layout</button>}
      </Dropdown>
    </div>
    {lens === 'table' && <HighTable cacheKey={name} data={df} onError={setError} />}
    {lens === 'metadata' && <ParquetMetadata metadata={metadata} />}
    {lens === 'layout' && byteLength && <ParquetLayout byteLength={byteLength} metadata={metadata} />}
  </>
}

/**
 * Returns the file size in human readable format.
 *
 * @param {number} bytes file size in bytes
 * @returns {string} formatted file size string
 */
function formatFileSize(bytes: number): string {
  const sizes = ['b', 'kb', 'mb', 'gb', 'tb']
  if (bytes === 0) return '0 b'
  const i = Math.floor(Math.log2(bytes) / 10)
  if (i === 0) return `${bytes} b`
  const base = bytes / Math.pow(1024, i)
  return `${base < 10 ? base.toFixed(1) : Math.round(base)} ${sizes[i]}`
}
