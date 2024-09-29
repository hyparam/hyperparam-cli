import type { DataFrame } from 'hightable'
import {
  AsyncBuffer, SchemaTree, parquetMetadataAsync, parquetQuery, parquetSchema,
} from 'hyparquet'
import { compressors } from 'hyparquet-compressors'
import { readableStreamToArrayBuffer } from './streamConverters.js'

/**
 * Construct a dataframe from a parquet file asynchronously.
 */
export async function parquetDataFrame(asyncBuffer: AsyncBuffer): Promise<DataFrame> {
  // load parquet metadata
  const metadata = await parquetMetadataAsync(asyncBuffer)

  // construct dataframe
  const { children }: SchemaTree = parquetSchema(metadata)
  // TODO: concat child names for like-like columns?
  const header = children.map(child => child.element.name)
  const numRows = Number(metadata.num_rows)
  return {
    header,
    numRows,
    rows(rowStart?: number, rowEnd?: number, orderBy?: string) {
      return parquetQuery({ metadata, compressors, file: asyncBuffer, rowStart, rowEnd, orderBy })
    },
    sortable: true,
  }
}

export async function asyncBufferFrom(url: string): Promise<AsyncBuffer> {
  // get byteLength with head
  const res = await fetch(url, { method: 'HEAD' })
  if (!res.ok) throw new Error(`Failed to fetch parquet file: ${res.statusText}`)
  const contentLength = res.headers.get('Content-Length')
  if (!contentLength) throw new Error('Content-Length header missing')
  const byteLength = Number(contentLength)

  // slice with range requests
  return {
    byteLength,
    slice: async (start: number, end?: number) => {
      const headers = new Headers({ Range: rangeString(start, end) })
      const res = await fetch(url, { headers })
      if (!res.ok || !res.body) throw new Error(`Failed to fetch parquet file: ${res.statusText}`)
      return readableStreamToArrayBuffer(res.body)
    },
  }
}


/**
 * Convert a start and end byte offset into a range string.
 * If start is negative, end must be undefined.
 */
export function rangeString(start: number, end?: number): string {
  if (start < 0) {
    if (end !== undefined) throw new Error(`invalid suffix range [${start}, ${end}]`)
    return `bytes=${start}`
  } else if (end !== undefined) {
    if (start >= end) throw new Error(`invalid empty range [${start}, ${end}]`)
    return `bytes=${start}-${end - 1}`
  } else {
    return `bytes=${start}-`
  }
}
