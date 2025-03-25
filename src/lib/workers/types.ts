import { ColumnData, FileMetaData } from 'hyparquet'

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
// Cells is defined in hightable, but uses any, not unknown
export type Cells = Record<string, unknown> ;

export interface CommonWorkerOptions {
  metadata: FileMetaData,
  from: AsyncBufferFrom
}
interface Message {
  queryId: number
}
export interface ErrorMessage extends Message {
  error: Error
}

/* Query worker */
export interface QueryWorkerOptions extends CommonWorkerOptions {
  rowStart?: number,
  rowEnd?: number,
  onChunk?: (chunk: ColumnData) => void
}
export interface QueryClientMessage extends QueryWorkerOptions, Message {
  kind: 'query',
  chunks?: boolean
}
export interface ChunkMessage extends Message {
  chunk: ColumnData
}
export interface ResultMessage extends Message {
  result: Cells[]
}
export type QueryWorkerMessage = ChunkMessage | ResultMessage | ErrorMessage

/* ColumnRanks worker */
export interface ColumnRanksWorkerOptions extends CommonWorkerOptions {
  column: string
}
export interface ColumnRanksClientMessage extends ColumnRanksWorkerOptions, Message {
  kind: 'columnRanks'
}
export interface ColumnRanksMessage extends Message {
  columnRanks: number[]
}
export type ColumnRanksWorkerMessage = ColumnRanksMessage | ErrorMessage

export type ClientMessage = QueryClientMessage | ColumnRanksClientMessage
