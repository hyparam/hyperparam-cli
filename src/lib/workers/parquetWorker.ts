import { AsyncBuffer, ColumnData, parquetQuery, parquetRead, parquetReadObjects } from 'hyparquet'
import type { SubColumnData } from 'hyparquet/src/types.js'
import { compressors } from 'hyparquet-compressors'
import type { ChunkMessage, ClientMessage, CompleteMessage, PageMessage, ParquetQueryResolveMessage, ParquetReadObjectsResolveMessage, ParquetReadResolveMessage, RejectMessage, Rows } from './types.js'
import { fromToAsyncBuffer } from './utils.js'

const cache = new Map<string, Promise<AsyncBuffer>>()

function postCompleteMessage ({ queryId, rows }: Omit<CompleteMessage, 'kind'>) {
  self.postMessage({ kind: 'onComplete', queryId, rows })
}
function postChunkMessage ({ chunk, queryId }: Omit<ChunkMessage, 'kind'>) {
  self.postMessage({ kind: 'onChunk', chunk, queryId })
}
function postPageMessage ({ page, queryId }: Omit<PageMessage, 'kind'>) {
  self.postMessage({ kind: 'onPage', page, queryId })
}
function postErrorMessage ({ error, queryId }: Omit<RejectMessage, 'kind'>) {
  self.postMessage({ kind: 'onReject', error, queryId })
}
function postParquetReadResultMessage ({ queryId }: Omit<ParquetReadResolveMessage, 'kind'>) {
  self.postMessage({ kind: 'onParquetReadResolve', queryId })
}
function postParquetReadObjectsResultMessage ({ queryId, rows }: Omit<ParquetReadObjectsResolveMessage, 'kind'>) {
  self.postMessage({ kind: 'onParquetReadObjectsResolve', queryId, rows })
}
function postParquetQueryResultMessage ({ queryId, rows }: Omit<ParquetQueryResolveMessage, 'kind'>) {
  self.postMessage({ kind: 'onParquetQueryResolve', queryId, rows })
}

self.onmessage = async ({ data }: { data: ClientMessage }) => {
  const { queryId, from, kind, options } = data
  const file = await fromToAsyncBuffer(from, cache)
  try {
    if (kind === 'parquetReadObjects') {
      const rows = (await parquetReadObjects({ ...options, rowFormat: 'object', file, compressors, onChunk, onPage })) as Rows
      postParquetReadObjectsResultMessage({ queryId, rows })
    } else if (kind === 'parquetQuery') {
      const rows = await parquetQuery({ ...options, file, compressors, onChunk, onPage })
      postParquetQueryResultMessage({ queryId, rows })
    } else {
      await parquetRead({ ...options, rowFormat: 'object', file, compressors, onComplete, onChunk, onPage })
      postParquetReadResultMessage({ queryId })
    }
  } catch (error) {
    postErrorMessage({ error: error as Error, queryId })
  }

  function onComplete(rows: Rows) {
    postCompleteMessage({ queryId, rows })
  }
  function onChunk(chunk: ColumnData) {
    postChunkMessage({ chunk, queryId })
  }
  function onPage(page: SubColumnData) {
    postPageMessage({ page, queryId })
  }
}
