import type { ColumnData } from 'hyparquet'
import { AsyncBuffer, parquetRead, parquetReadObjects } from 'hyparquet'
import { compressors } from 'hyparquet-compressors'
import type { ChunkMessage, ClientMessage, CompleteMessage, EmptyResultMessage, ErrorMessage, PageMessage, RowObjectsResultMessage } from './types.js'
import { fromToAsyncBuffer } from './utils.js'

const cache = new Map<string, Promise<AsyncBuffer>>()

function postCompleteMessage ({ queryId, rows }: CompleteMessage) {
  self.postMessage({ queryId, rows })
}
function postChunkMessage ({ chunk, queryId }: ChunkMessage) {
  self.postMessage({ chunk, queryId })
}
function postPageMessage ({ page, queryId }: PageMessage) {
  self.postMessage({ page, queryId })
}
function postErrorMessage ({ error, queryId }: ErrorMessage) {
  self.postMessage({ error, queryId })
}
function postRowObjectsResultMessage ({ queryId, rowObjects }: RowObjectsResultMessage) {
  self.postMessage({ queryId, rowObjects })
}
function postEmptyResultMessage ({ queryId }: EmptyResultMessage) {
  self.postMessage({ queryId })
}

self.onmessage = async ({ data }: { data: ClientMessage }) => {
  const { kind, queryId, from, ...options } = data
  const file = await fromToAsyncBuffer(from, cache)
  try {
    if (kind === 'parquetReadObjects') {
      const rowObjects = await parquetReadObjects({ ...options, file, compressors, onChunk, onPage })
      postRowObjectsResultMessage({ queryId, rowObjects })
    } else {
      await parquetRead({ ...options, file, compressors, onComplete, onChunk, onPage })
      postEmptyResultMessage({ queryId })
    }
  } catch (error) {
    postErrorMessage({ error: error as Error, queryId })
  }

  function onComplete(rows: unknown[][]) {
    postCompleteMessage({ queryId, rows })
  }
  function onChunk(chunk: ColumnData) {
    postChunkMessage({ chunk, queryId })
  }
  function onPage(page: ColumnData) {
    postPageMessage({ page, queryId })
  }
}
