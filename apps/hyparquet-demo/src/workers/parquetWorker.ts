import { ColumnData, parquetQuery } from 'hyparquet'
import { compressors } from 'hyparquet-compressors'
import { asyncBufferFrom } from '../utils.js'
import type {
  ChunkMessage,
  ErrorMessage,
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

self.onmessage = async ({ data }: {
  data: ParquetReadWorkerOptions & { queryId: number; chunks: boolean };
}) => {
  const { metadata, from, rowStart, rowEnd, orderBy, columns, queryId, chunks } = data
  const file = await asyncBufferFrom(from)
  /**
   * @type {((chunk: ColumnData) => void) | undefined}
   */
  const onChunk: ((chunk: ColumnData) => void) | undefined = chunks ? chunk => { postChunkMessage({ chunk, queryId }) } : undefined
  try {
    const result = await parquetQuery({
      metadata, file, rowStart, rowEnd, orderBy, columns, compressors, onChunk,
    })
    postResultMessage({ result, queryId })
  } catch (error) {
    postErrorMessage({ error: error as Error, queryId })
  }
}
