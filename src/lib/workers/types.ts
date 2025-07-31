import type { ColumnData, FileMetaData } from 'hyparquet'

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

export interface ResultMessage {
  queryId: number
}
export interface ErrorMessage extends ResultMessage {
  error: Error
}
export interface ChunkMessage extends ResultMessage {
  chunk: ColumnData
}
export type WorkerMessage = ChunkMessage | ResultMessage | ErrorMessage

export interface WorkerOptions {
  metadata: FileMetaData,
  from: AsyncBufferFrom
  rowStart?: number,
  rowEnd?: number,
  columns?: string[],
  onChunk: (chunk: ColumnData) => void
}
export type ClientMessage = Omit<WorkerOptions, 'onChunk'> & ResultMessage
