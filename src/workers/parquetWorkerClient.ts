import { asyncBufferFromUrl, cachedAsyncBuffer, AsyncBuffer, FileMetaData } from 'hyparquet'

// Serializable constructor for AsyncBuffers
export interface AsyncBufferFrom {
  url: string
  byteLength: number
}

// Same as ParquetReadOptions, but AsyncBufferFrom instead of AsyncBuffer
interface ParquetReadWorkerOptions {
  asyncBuffer: AsyncBufferFrom
  metadata?: FileMetaData // parquet metadata, will be parsed if not provided
  columns?: number[] // columns to read, all columns if undefined
  rowStart?: number // inclusive
  rowEnd?: number // exclusive
  orderBy?: string // column to sort by
}

let worker: Worker | undefined

/**
 * Presents almost the same interface as parquetRead, but runs in a worker.
 * This is useful for reading large parquet files without blocking the main thread.
 * Instead of taking an AsyncBuffer, it takes a FileContent, because it needs
 * to be serialized to the worker.
 */
export function parquetQueryWorker({
  metadata, asyncBuffer, rowStart, rowEnd, orderBy }: ParquetReadWorkerOptions
): Promise<Record<string, any>[]> {
  return new Promise((resolve, reject) => {
    // Create a worker
    if (!worker) {
      worker = new Worker(new URL('worker.min.js', import.meta.url))
    }
    worker.onmessage = ({ data }) => {
      // Convert postmessage data to callbacks
      if (data.error) {
        reject(data.error)
      } else if (data.result) {
        resolve(data.result)
      } else {
        reject(new Error('Unexpected message from worker'))
      }
    }
    worker.postMessage({ metadata, asyncBuffer, rowStart, rowEnd, orderBy })
  })
}

/**
 * Convert AsyncBufferFrom to AsyncBuffer and cache results.
 */
export async function asyncBufferFrom(from: AsyncBufferFrom): Promise<AsyncBuffer> {
  const key = JSON.stringify(from)
  const cached = cache.get(key)
  if (cached) return cached
  const asyncBuffer = asyncBufferFromUrl(from.url, from.byteLength)
  cache.set(key, asyncBuffer.then(cachedAsyncBuffer))
  return asyncBuffer
}
const cache = new Map<string, Promise<AsyncBuffer>>()
