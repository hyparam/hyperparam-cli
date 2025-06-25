import ParquetWorker from './parquetWorker?worker&inline'
/// ^ the worker is bundled with the main thread code (inline) which is easier for users to import
/// (no need to copy the worker file to the right place)
import type { ColumnData } from 'hyparquet'
import type { Cells, ColumnRanksClientMessage, ColumnRanksWorkerMessage, ColumnRanksWorkerOptions, QueryClientMessage, QueryWorkerMessage, QueryWorkerOptions } from './types.js'

let worker: Worker | undefined
let nextQueryId = 0
interface RowsQueryAgent {
  kind: 'query'
  resolve: (value: Cells[]) => void
  reject: (error: Error) => void
  onChunk?: (chunk: ColumnData) => void
}
interface ColumnRanksQueryAgent {
  kind: 'columnRanks'
  resolve: (value: number[]) => void
  reject: (error: Error) => void
}
type QueryAgent = RowsQueryAgent | ColumnRanksQueryAgent

const pending = new Map<number, QueryAgent>()

function getWorker() {
  if (!worker) {
    worker = new ParquetWorker()
    worker.onmessage = ({ data }: { data: QueryWorkerMessage | ColumnRanksWorkerMessage }) => {
      const pendingQueryAgent = pending.get(data.queryId)
      if (!pendingQueryAgent) {
        console.warn(
          `Unexpected: no pending promise found for queryId: ${data.queryId.toString()}`
        )
        return
      }

      if (pendingQueryAgent.kind === 'query') {
        const { onChunk, resolve, reject } = pendingQueryAgent
        if ('error' in data) {
          reject(data.error)
        } else if ('result' in data) {
          resolve(data.result)
        } else if ('chunk' in data) {
          onChunk?.(data.chunk)
        } else {
          reject(new Error('Unexpected message from worker'))
        }
        return
      }

      const { resolve, reject } = pendingQueryAgent
      if ('error' in data) {
        reject(data.error)
      } else if ('columnRanks' in data) {
        resolve(data.columnRanks)
      } else {
        reject(new Error('Unexpected message from worker'))
      }
    }
  }
  return worker
}

/**
 * Presents almost the same interface as parquetRead, but runs in a worker.
 * This is useful for reading large parquet files without blocking the main thread.
 * Instead of taking an AsyncBuffer, it takes a AsyncBufferFrom, because it needs
 * to be serialized to the worker.
 */
export function parquetQueryWorker({ metadata, from, rowStart, rowEnd, orderBy, filter, onChunk }: QueryWorkerOptions): Promise<Cells[]> {
  // TODO(SL) Support passing columns?
  return new Promise((resolve, reject) => {
    const queryId = nextQueryId++
    pending.set(queryId, { kind: 'query', resolve, reject, onChunk })
    const worker = getWorker()

    // If caller provided an onChunk callback, worker will send chunks as they are parsed
    const chunks = onChunk !== undefined
    const message: QueryClientMessage = { queryId, metadata, from, rowStart, rowEnd, orderBy, filter, chunks, kind: 'query' }
    worker.postMessage(message)
  })
}

export function parquetColumnRanksWorker({ metadata, from, column }: ColumnRanksWorkerOptions): Promise<number[]> {
  return new Promise((resolve, reject) => {
    const queryId = nextQueryId++
    pending.set(queryId, { kind: 'columnRanks', resolve, reject })
    const worker = getWorker()
    const message: ColumnRanksClientMessage = { queryId, metadata, from, column, kind: 'columnRanks' }
    worker.postMessage(message)
  })
}
