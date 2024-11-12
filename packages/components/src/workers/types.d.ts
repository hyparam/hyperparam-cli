import { ColumnData, FileMetaData, ParquetReadOptions } from 'hyparquet'

// Serializable constructor for AsyncBuffers
export interface AsyncBufferFromUrl {
  url: string
  byteLength: number
}
// Same as ParquetReadOptions, but AsyncBufferFrom instead of AsyncBuffer
export interface ParquetReadWorkerOptions extends Omit<ParquetReadOptions, 'file'> {
  from: AsyncBufferFromUrl
  orderBy?: string
  sortIndex?: boolean
}
// Row is defined in hightable, but not exported + we change any to unknown
export type Row = Record<string, unknown> ;

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
  from: AsyncBufferFromUrl
  orderBy: string
}