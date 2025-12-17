import type { ColumnData, ParquetReadOptions } from 'hyparquet'
import { parquetQuery } from 'hyparquet'
import { SubColumnData } from 'hyparquet/src/types.js'

// https://github.com/hyparam/hyparquet/pull/105
type ParquetQueryFilter = Exclude<Parameters<typeof parquetQuery>[0]['filter'], undefined>

// Serializable constructors for AsyncBuffers
interface AsyncBufferFromFile {
  file: File
  byteLength: number
}
interface AsyncBufferFromUrl {
  url: string
  byteLength: number
  requestInit?: RequestInit
}
export type AsyncBufferFrom = AsyncBufferFromFile | AsyncBufferFromUrl

// Only rowFormat 'object' is supported in the worker
export type Rows = Record<string, unknown>[]

/**
 * Options for the worker version of parquetRead
 * The same options as parquetRead, but:
 * - 'file' must be replaced with 'from': "AsyncBufferFrom"
 * - 'compressors' are not configurable, the worker uses hyparquet-compressors
 * - 'parsers' are not configurable, the worker uses the default parsers
 */
export interface ParquetReadWorkerOptions extends Omit<ParquetReadOptions, 'compressors' | 'parsers' | 'file' | 'rowFormat' | 'onComplete'> {
  from: AsyncBufferFrom
  // rowFormat 'array' is not supported in the worker.
  rowFormat?: 'object'
  onComplete?: (rows: Rows) => void
}
/**
 * Options for the worker version of parquetReadObjects
 * The same options as parquetReadObjects, but:
 * - 'file' must be replaced with 'from': "AsyncBufferFrom"
 * - 'compressors' are not configurable, the worker uses hyparquet-compressors
 * - 'parsers' are not configurable, the worker uses the default parsers
 */
export type ParquetReadObjectsWorkerOptions = Omit<ParquetReadWorkerOptions, 'onComplete'>
/**
 * Options for the worker version of parquetQuery
 * The same options as parquetQuery, but:
 * - 'file' must be replaced with 'from': "AsyncBufferFrom"
 * - 'compressors' are not configurable, the worker uses hyparquet-compressors
 * - 'parsers' are not configurable, the worker uses the default parsers
 */
export interface ParquetQueryWorkerOptions extends ParquetReadWorkerOptions {
  filter?: ParquetQueryFilter,
  orderBy?: string
}

/**
 * Messages sent by the client function to the worker
 */
export interface QueryId {
  queryId: number
}
export interface From {
  from: AsyncBufferFrom
}
export interface ParquetReadClientMessage extends QueryId, From {
  kind: 'parquetRead'
  options: Omit<ParquetReadWorkerOptions, 'onComplete' | 'onChunk' | 'onPage' | 'from'>
}
export interface ParquetReadObjectsClientMessage extends QueryId, From {
  kind: 'parquetReadObjects'
  options: Omit<ParquetReadObjectsWorkerOptions, 'onChunk' | 'onPage'| 'from'>
}
export interface ParquetQueryClientMessage extends QueryId, From {
  kind: 'parquetQuery'
  options: Omit<ParquetQueryWorkerOptions, 'onComplete' | 'onChunk' | 'onPage'| 'from'>
}
export type ClientMessage = ParquetQueryClientMessage | ParquetReadObjectsClientMessage | ParquetReadClientMessage

/**
 * Messages sent by the worker to the client
 */
export interface CompleteMessage extends QueryId {
  kind: 'onComplete'
  rows: Rows
}
export interface ChunkMessage extends QueryId {
  kind: 'onChunk'
  chunk: ColumnData
}
export interface PageMessage extends QueryId {
  kind: 'onPage'
  page: SubColumnData
}
export interface RejectMessage extends QueryId {
  kind: 'onReject'
  error: Error
}
export interface ParquetReadResolveMessage extends QueryId {
  kind: 'onParquetReadResolve'
}
export interface ParquetReadObjectsResolveMessage extends QueryId {
  kind: 'onParquetReadObjectsResolve'
  rows: Rows
}
export interface ParquetQueryResolveMessage extends QueryId {
  kind: 'onParquetQueryResolve'
  rows: Rows
}
export type WorkerMessage = CompleteMessage | ChunkMessage | PageMessage | RejectMessage | ParquetReadResolveMessage | ParquetReadObjectsResolveMessage | ParquetQueryResolveMessage
