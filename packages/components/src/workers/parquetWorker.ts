import { AsyncBuffer, ColumnData, parquetQuery } from 'hyparquet'
import { compressors } from 'hyparquet-compressors'
import { asyncBufferFromUrl } from '../lib/utils.ts'
import type {
  AsyncBufferFrom,
  ChunkMessage,
  ErrorMessage,
  IndicesMessage,
  ParquetReadWorkerOptions,
  ResultMessage,
} from './types.d.ts'

function postChunkMessage ({ chunk, queryId }: ChunkMessage) {
  self.postMessage({ chunk, queryId })
}
function postResultMessage ({ result, queryId }: ResultMessage) {
  self.postMessage({ result, queryId })
}
function postErrorMessage ({ error, queryId }: ErrorMessage) {
  self.postMessage({ error, queryId })
}
function postIndicesMessage ({ indices, queryId }: IndicesMessage) {
  self.postMessage({ indices, queryId })
}

// Cache for AsyncBuffers
const cache = new Map<string, Promise<AsyncBuffer>>()

self.onmessage = async ({
  data,
}: {
  data: ParquetReadWorkerOptions & { queryId: number; chunks: boolean };
}) => {
  const {
    metadata,
    from,
    rowStart,
    rowEnd,
    orderBy,
    columns,
    queryId,
    chunks,
    sortIndex,
  } = data
  const file = await asyncBufferFrom(from)
  if (sortIndex === undefined) {
    const onChunk = chunks
      ? (chunk: ColumnData) => {
        postChunkMessage({ chunk, queryId })
      }
      : undefined
    try {
      const result = await parquetQuery({
        metadata,
        file,
        rowStart,
        rowEnd,
        orderBy,
        columns,
        compressors,
        onChunk,
      })
      postResultMessage({ result, queryId })
    } catch (error) {
      postErrorMessage({ error: error as Error, queryId })
    }
  } else {
    try {
      // Special case for sorted index
      if (orderBy === undefined)
        throw new Error('sortParquetWorker requires orderBy')
      if (rowStart !== undefined || rowEnd !== undefined)
        throw new Error('sortIndex requires all rows')
      const sortColumn = await parquetQuery({
        metadata,
        file,
        columns: [orderBy],
        compressors,
      })
      const indices = Array.from(sortColumn, (_, index) => index).sort((a, b) =>
        compare<unknown>(sortColumn[a][orderBy], sortColumn[b][orderBy]),
      )
      postIndicesMessage({ indices, queryId })
    } catch (error) {
      postErrorMessage({ error: error as Error, queryId })
    }
  }
}

function compare<T>(a: T, b: T): number {
  if (a < b) return -1
  if (a > b) return 1
  return 1 // TODO: how to handle nulls?
}

/**
 * Convert AsyncBufferFrom to AsyncBuffer and cache results.
 */
function asyncBufferFrom(
  from: AsyncBufferFrom,
): Promise<AsyncBuffer> {
  const key = JSON.stringify(from)
  const cached = cache.get(key)
  if (cached) return cached
  const asyncBuffer = asyncBufferFromUrl(from).then(cachedAsyncBuffer)
  cache.set(key, asyncBuffer)
  return asyncBuffer
}

type Awaitable<T> = T | Promise<T>;

function cachedAsyncBuffer(asyncBuffer: AsyncBuffer): AsyncBuffer {
  const cache = new Map<string, Awaitable<ArrayBuffer>>()
  const { byteLength } = asyncBuffer
  return {
    byteLength,
    /**
     * @param {number} start
     * @param {number} [end]
     * @returns {Awaitable<ArrayBuffer>}
     */
    slice(start: number, end?: number): Awaitable<ArrayBuffer> {
      const key = cacheKey(start, end, byteLength)
      const cached = cache.get(key)
      if (cached) return cached
      // cache miss, read from file
      const promise = asyncBuffer.slice(start, end)
      cache.set(key, promise)
      return promise
    },
  }
}

/**
 * Returns canonical cache key for a byte range 'start,end'.
 * Normalize int-range and suffix-range requests to the same key.
 *
 * @param {number} start start byte of range
 * @param {number} [end] end byte of range, or undefined for suffix range
 * @param {number} [size] size of file, or undefined for suffix range
 * @returns {string}
 */
function cacheKey(start: number, end?: number, size?: number): string {
  if (start < 0) {
    if (end !== undefined)
      throw new Error(
        `invalid suffix range [${start.toString()}, ${end.toString()}]`,
      )
    if (size === undefined) return `${start.toString()},`
    return `${(size + start).toString()},${size.toString()}`
  } else if (end !== undefined) {
    if (start > end)
      throw new Error(
        `invalid empty range [${start.toString()}, ${end.toString()}]`,
      )
    return `${start.toString()},${end.toString()}`
  } else if (size === undefined) {
    return `${start.toString()},`
  } else {
    return `${start.toString()},${size.toString()}`
  }
}
