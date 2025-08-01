import type { ColumnData, ParquetReadOptions } from 'hyparquet'

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

export type Rows = unknown[][] | Record<string, unknown>[]

/**
 * Options for the worker version of parquetRead
 * The same options as parquetRead, but:
 * - 'file' must be replaced with 'from': "AsyncBufferFrom"
 * - 'compressors' are not configurable, the worker uses hyparquet-compressors
 * - 'parsers' are not configurable, the worker uses the default parsers
 */
export interface ParquetReadWorkerOptions extends Omit<ParquetReadOptions, 'compressors' | 'parsers' | 'file' | 'onComplete'> {
  onComplete?: (rows: Rows) => void // fix for https://github.com/hyparam/hyparquet/issues/28
  from: AsyncBufferFrom
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
 * Messages sent by the client function to the worker
 */
export interface QueryId {
  queryId: number
}
export type SerializableOptions = Omit<ParquetReadWorkerOptions, 'onComplete' | 'onChunk' | 'onPage'>
export interface ClientMessage extends SerializableOptions, QueryId {
  kind: 'parquetReadObjects' | 'parquetRead'
}

/**
 * Messages sent by the worker to the client
 */
// export interface ResultMessage {
//   queryId: number
// }
export interface CompleteMessage extends QueryId {
  rows: Rows
}
export interface ChunkMessage extends QueryId {
  chunk: ColumnData
}
export interface PageMessage extends QueryId {
  page: ColumnData
}
export interface ErrorMessage extends QueryId {
  error: Error
}
export interface RowObjectsResultMessage extends QueryId {
  rowObjects: Rows
}
export type EmptyResultMessage = QueryId
export type WorkerMessage = CompleteMessage | ChunkMessage | PageMessage | ErrorMessage | RowObjectsResultMessage | EmptyResultMessage
