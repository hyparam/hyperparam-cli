import { ColumnData, parquetQuery } from 'hyparquet'
import { compressors } from 'hyparquet-compressors'
import { asyncBufferFrom } from '../utils.js'
import type { ChunkMessage, ErrorMessage, IndicesMessage, ParquetReadWorkerOptions, ResultMessage } from './types.js'

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

self.onmessage = async ({ data }: {
  data: ParquetReadWorkerOptions & { queryId: number; chunks: boolean };
}) => {
  const { metadata, from, rowStart, rowEnd, orderBy, columns, queryId, chunks, sortIndex } = data
  const file = await asyncBufferFrom(from)
  if (sortIndex === undefined) {
    const onChunk = chunks ? (chunk: ColumnData) => { postChunkMessage({ chunk, queryId }) } : undefined
    try {
      const result = await parquetQuery({ metadata, file, rowStart, rowEnd, orderBy, columns, compressors, onChunk })
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
      const sortColumn = await parquetQuery({ metadata, file, columns: [orderBy], compressors })
      const indices = Array.from(sortColumn, (_, index) => index).sort((a, b) =>
        compare<unknown>(sortColumn[a]?.[orderBy], sortColumn[b]?.[orderBy])
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
