import ParquetWorker from './parquetWorker?worker&inline'
/// ^ the worker is bundled with the main thread code (inline) which is easier for users to import
/// (no need to copy the worker file to the right place)
import { AsyncBuffer, ColumnData, FileMetaData, ParquetReadOptions } from 'hyparquet'
import { asyncBufferFromUrl } from '../lib/utils.ts'

// Serializable constructor for AsyncBuffers
export interface AsyncBufferFrom {
  url: string
  byteLength: number
  headers?: Record<string, string>
}
// Same as ParquetReadOptions, but AsyncBufferFrom instead of AsyncBuffer
export interface ParquetReadWorkerOptions extends Omit<ParquetReadOptions, 'file'> {
  from: AsyncBufferFrom
  orderBy?: string
  sortIndex?: boolean
}
// Row is defined in hightable, but not exported + we change any to unknown
export type Row = Record<string, unknown>;

interface Message {
  queryId: number
}
export interface ChunkMessage extends Message {
  chunk: ColumnData
}
export interface ResultMessage extends Message {
  result: Row[]
}
export interface IndicesMessage extends Message {
  indices: number[]
}
export interface ErrorMessage extends Message {
  error: Error
}

export type ParquetMessage = ChunkMessage | ResultMessage | ErrorMessage
export type SortParquetMessage = IndicesMessage | ErrorMessage

export interface ParquetSortIndexOptions {
  metadata: FileMetaData
  from: AsyncBufferFrom
  orderBy: string
}


let worker: Worker | undefined
let nextQueryId = 0
interface SortQueryAgent {
  kind: 'sortIndex';
  resolve: (value: number[]) => void;
  reject: (error: Error) => void;
}
interface RowsQueryAgent {
  kind: 'query';
  resolve: (value: Row[]) => void;
  reject: (error: Error) => void;
  onChunk?: (chunk: ColumnData) => void;
}
type QueryAgent = SortQueryAgent | RowsQueryAgent

const pending = new Map<number, QueryAgent>()

function getWorker() {
  if (!worker) {
    worker = new ParquetWorker()
    worker.onmessage = ({ data }: { data: ParquetMessage | SortParquetMessage }) => {
      const pendingQueryAgent = pending.get(data.queryId)
      if (!pendingQueryAgent) {
        throw new Error(
          `Unexpected: no pending promise found for queryId: ${data.queryId.toString()}`,
        )
        // TODO(SL): should never happen. But if it does, I'm not sure if throwing an error here helps.
      }
      if (pendingQueryAgent.kind === 'query') {
        const { resolve, reject, onChunk } = pendingQueryAgent
        if ('error' in data) {
          reject(data.error)
        } else if ('result' in data) {
          resolve(data.result)
        } else if ('chunk' in data) {
          onChunk?.(data.chunk)
        } else {
          reject(new Error('Unexpected message from worker'))
        }
      } else {
        const { resolve, reject } = pendingQueryAgent
        if ('error' in data) {
          reject(data.error)
        } else if ('indices' in data) {
          resolve(data.indices)
        } else {
          reject(new Error('Unexpected message from worker'))
        }
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
export function parquetQueryWorker({
  metadata,
  from,
  rowStart,
  rowEnd,
  orderBy,
  onChunk,
}: ParquetReadWorkerOptions): Promise<Row[]> {
  return new Promise((resolve, reject) => {
    const queryId = nextQueryId++
    pending.set(queryId, { kind: 'query', resolve, reject, onChunk })
    const worker = getWorker()

    // If caller provided an onChunk callback, worker will send chunks as they are parsed
    const chunks = onChunk !== undefined
    worker.postMessage({
      queryId,
      metadata,
      from,
      rowStart,
      rowEnd,
      orderBy,
      chunks,
    })
  })
}

export function parquetSortIndexWorker({ metadata, from, orderBy }: ParquetSortIndexOptions): Promise<number[]> {
  return new Promise((resolve, reject) => {
    const queryId = nextQueryId++
    pending.set(queryId, { kind: 'sortIndex', resolve, reject })
    const worker = getWorker()
    worker.postMessage({
      queryId, metadata, from, orderBy, sortIndex: true,
    })
  })
}

/**
 * Convert AsyncBufferFrom to AsyncBuffer and cache results.
 */
export function asyncBufferFrom(
  from: AsyncBufferFrom,
): Promise<AsyncBuffer> {
  const key = JSON.stringify(from)
  const cached = cache.get(key)
  if (cached) return cached
  const asyncBuffer = asyncBufferFromUrl(from).then(cachedAsyncBuffer)
  cache.set(key, asyncBuffer)
  return asyncBuffer
}
const cache = new Map<string, Promise<AsyncBuffer>>()

export function compare<T>(a: T, b: T): number {
  if (a < b) return -1
  if (a > b) return 1
  return 1 // TODO: how to handle nulls?
}

// TODO(SL): once the types in cachedAsyncBuffer are fixed, import all the following from hyparquet
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
