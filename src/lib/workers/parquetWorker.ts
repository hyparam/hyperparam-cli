import { AsyncBuffer, ColumnData, parquetQuery, parquetRead, parquetReadObjects } from 'hyparquet'
import type { SubColumnData } from 'hyparquet/src/types.js'
import { compressors } from 'hyparquet-compressors'
import type { ChunkMessage, ClientMessage, CompleteMessage, PageMessage, ParquetQueryResolveMessage, ParquetReadObjectsResolveMessage, ParquetReadResolveMessage, RejectMessage, Rows } from './types.js'
import { fromToAsyncBuffer } from './utils.js'

const cache = new Map<string, Promise<AsyncBuffer>>()
const aborted = new Set<number>()

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
  if (data.kind === 'abort') {
    aborted.add(data.queryId)
    return
  }
  const { queryId, from, kind, options } = data
  const file = await fromToAsyncBuffer(from, cache)
  try {
    if (kind === 'parquetReadObjects') {
      const rows = (await parquetReadObjects({ ...options, rowFormat: 'object', file, compressors, onChunk, onPage })) as Rows
      if (aborted.delete(queryId)) return
      postParquetReadObjectsResultMessage({ queryId, rows })
    } else if (kind === 'parquetQuery') {
      const rows = await parquetQuery({ ...options, file, compressors, onChunk, onPage })
      if (aborted.delete(queryId)) return
      postParquetQueryResultMessage({ queryId, rows })
    } else {
      await parquetRead({ ...options, rowFormat: 'object', file, compressors, onComplete, onChunk, onPage })
      if (aborted.delete(queryId)) return
      postParquetReadResultMessage({ queryId })
    }
  } catch (error) {
    if (aborted.delete(queryId)) return
    postErrorMessage({ error: error as Error, queryId })
  }

  function onComplete(rows: Rows) {
    if (aborted.has(queryId)) return
    postCompleteMessage({ queryId, rows })
  }
  function onChunk(chunk: ColumnData) {
    if (aborted.has(queryId)) return
    postChunkMessage({ chunk, queryId })
  }
  function onPage(page: SubColumnData) {
    if (aborted.has(queryId)) return
    postPageMessage({ page, queryId })
  }
}
