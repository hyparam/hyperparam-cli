import type { ColumnData } from 'hyparquet'
import { parquetRead } from 'hyparquet'
import { compressors } from 'hyparquet-compressors'
import { asyncBufferFrom } from '../utils.js'
import type { ChunkMessage, ClientMessage, ErrorMessage, ResultMessage } from './types.js'

function postChunkMessage ({ chunk, queryId }: ChunkMessage) {
  self.postMessage({ chunk, queryId })
}
function postResultMessage ({ queryId }: ResultMessage) {
  self.postMessage({ queryId })
}
function postErrorMessage ({ error, queryId }: ErrorMessage) {
  self.postMessage({ error, queryId })
}

self.onmessage = async ({ data }: { data: ClientMessage }) => {
  const { rowStart, rowEnd, columns, metadata, from, queryId } = data
  const file = await asyncBufferFrom(from)
  try {
    await parquetRead({ metadata, file, rowStart, rowEnd, columns, compressors, onChunk })
    postResultMessage({ queryId })
  } catch (error) {
    postErrorMessage({ error: error as Error, queryId })
  }

  function onChunk(chunk: ColumnData) {
    postChunkMessage({ chunk, queryId })
  }
}
