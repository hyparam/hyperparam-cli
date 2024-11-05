import { asyncBufferFromUrl, cachedAsyncBuffer, AsyncBuffer, ParquetReadOptions, FileMetaData } from 'hyparquet'

// Serializable constructor for AsyncBuffers
export interface AsyncBufferFrom {
  url: string
  byteLength: number
}

// Same as ParquetReadOptions, but AsyncBufferFrom instead of AsyncBuffer
interface ParquetReadWorkerOptions extends Omit<ParquetReadOptions, 'file'> {
  from: AsyncBufferFrom
  orderBy?: string
  sortIndex?: boolean
}

let worker: Worker | undefined
let nextQueryId = 0
interface QueryAgent {
  resolve: (value: any) => void
  reject: (error: any) => void
  onChunk?: (chunk: any) => void
}
const pending = new Map<number, QueryAgent>()

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL('./parquetWorker', import.meta.url), { type: 'module' })
    worker.onmessage = ({ data }) => {
      const { resolve, reject, onChunk } = pending.get(data.queryId)!
      if (data.error) {
        reject(data.error)
      } else if (data.result) {
        resolve(data.result)
      } else if (data.chunk) {
        onChunk?.(data.chunk)
      } else {
        reject(new Error('Unexpected message from worker'))
      }
    }
  }
  return worker
}

/**
 * Presents almost the same interface as parquetRead, but runs in a worker.
 * This is useful for reading large parquet files without blocking the main thread.
 * Instead of taking an AsyncBuffer, it takes a AsyncBufferFrom, because it needs
 * to be serialized to the worker.
 */
export function parquetQueryWorker(
  { metadata, from, rowStart, rowEnd, orderBy, onChunk }: ParquetReadWorkerOptions
): Promise<Record<string, any>[]> {
  return new Promise((resolve, reject) => {
    const queryId = nextQueryId++
    pending.set(queryId, { resolve, reject, onChunk })
    const worker = getWorker()

    // If caller provided an onChunk callback, worker will send chunks as they are parsed
    const chunks = onChunk !== undefined
    worker.postMessage({
      queryId, metadata, from, rowStart, rowEnd, orderBy, chunks
    })
  })
}

interface ParquetSortIndexOptions {
  metadata: FileMetaData
  from: AsyncBufferFrom
  orderBy: string
}

export function parquetSortIndexWorker({ metadata, from, orderBy }: ParquetSortIndexOptions): Promise<number[]> {
  return new Promise((resolve, reject) => {
    const queryId = nextQueryId++
    pending.set(queryId, { resolve, reject })
    const worker = getWorker()

    worker.postMessage({
      queryId, metadata, from, orderBy, sortIndex: true
    })
  })
}

/**
 * Convert AsyncBufferFrom to AsyncBuffer and cache results.
 */
export async function asyncBufferFrom(from: AsyncBufferFrom): Promise<AsyncBuffer> {
  const key = JSON.stringify(from)
  const cached = cache.get(key)
  if (cached) return cached
  const asyncBuffer = asyncBufferFromUrl(from.url, from.byteLength).then(cachedAsyncBuffer)
  cache.set(key, asyncBuffer)
  return asyncBuffer
}
const cache = new Map<string, Promise<AsyncBuffer>>()

export function compare(a: any, b: any): number {
  if (a < b) return -1
  if (a > b) return 1
  return 1 // TODO: how to handle nulls?
}
