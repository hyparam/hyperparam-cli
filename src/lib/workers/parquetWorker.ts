import type { ColumnData } from 'hyparquet'
import { AsyncBuffer, asyncBufferFromUrl, cachedAsyncBuffer, parquetRead } from 'hyparquet'
import { compressors } from 'hyparquet-compressors'
import type { AsyncBufferFrom, ChunkMessage, ClientMessage, ErrorMessage, ResultMessage } from './types.js'

const cache = new Map<string, Promise<AsyncBuffer>>()

export function asyncBufferFrom(from: AsyncBufferFrom): Promise<AsyncBuffer> {
  if ('url' in from) {
    // Cached asyncBuffer for urls only
    const key = JSON.stringify(from)
    const cached = cache.get(key)
    if (cached) return cached
    const asyncBuffer = asyncBufferFromUrl(from).then(cachedAsyncBuffer)
    cache.set(key, asyncBuffer)
    return asyncBuffer
  } else {
    return from.file.arrayBuffer()
  }
}

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
