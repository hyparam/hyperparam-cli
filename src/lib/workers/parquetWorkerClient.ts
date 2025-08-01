import type { ColumnData } from 'hyparquet'
import type { ClientMessage, ParquetReadObjectsWorkerOptions, ParquetReadWorkerOptions, Rows, WorkerMessage } from './types.js'

let worker: Worker | undefined
let nextQueryId = 0
interface Agent {
  onComplete?: (rows: Rows) => void
  onChunk?: (chunk: ColumnData) => void
  onPage?: (page: ColumnData) => void
  reject: (error: Error) => void
  resolveEmpty?: () => void
  resolveRowObjects?: (rowObjects: Rows) => void
}

const pendingAgents = new Map<number, Agent>()

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL('./parquetWorker.js', import.meta.url), { type: 'module' })
    worker.onmessage = ({ data }: { data: WorkerMessage }) => {
      const pendingAgent = pendingAgents.get(data.queryId)
      if (!pendingAgent) {
        console.warn(
          `Unexpected: no pending promise found for queryId: ${data.queryId.toString()}`
        )
        return
      }

      const { onComplete, onChunk, onPage, reject, resolveEmpty, resolveRowObjects } = pendingAgent
      if ('rows' in data) {
        onComplete?.(data.rows)
      } else if ('chunk' in data) {
        onChunk?.(data.chunk)
      } else if ('page' in data) {
        onPage?.(data.page)
      } else {
        if ('error' in data) {
          reject(data.error)
        } else if ('rowObjects' in data) {
          resolveRowObjects?.(data.rowObjects)
        } else {
          resolveEmpty?.()
        }
        /* clean up */
        pendingAgents.delete(data.queryId)
        // TODO(SL): maybe terminate the worker when no pending agents left
      }
    }
  }
  return worker
}

/**
 * Presents almost the same interface as parquetRead, but runs in a worker.
 * This is useful for reading large parquet files without blocking the main thread.
 * Instead of taking an AsyncBuffer, it takes a AsyncBufferFrom, because it needs
 * to be serialized to the worker. Also: the worker uses hyparquet-compressors and
 * the default parsers.
 */
export function parquetReadWorker(options: ParquetReadWorkerOptions): Promise<void> {
  const { onComplete, onChunk, onPage, ...serializableOptions } = options
  return new Promise((resolve, reject) => {
    const queryId = nextQueryId++
    pendingAgents.set(queryId, { resolveEmpty: resolve, reject, onComplete, onChunk, onPage })
    const worker = getWorker()
    const message: ClientMessage = { queryId, ...serializableOptions, kind: 'parquetRead' }
    worker.postMessage(message)
  })
}

/**
 * Presents almost the same interface as parquetReadObjects, but runs in a worker.
 * This is useful for reading large parquet files without blocking the main thread.
 * Instead of taking an AsyncBuffer, it takes a AsyncBufferFrom, because it needs
 * to be serialized to the worker. Also: the worker uses hyparquet-compressors and
 * the default parsers.
 */
export function parquetReadObjectsWorker(options: ParquetReadObjectsWorkerOptions): Promise<Rows> {
  const { onChunk, onPage, ...serializableOptions } = options
  return new Promise((resolve, reject) => {
    const queryId = nextQueryId++
    pendingAgents.set(queryId, { resolveRowObjects: resolve, reject, onChunk, onPage })
    const worker = getWorker()
    const message: ClientMessage = { queryId, ...serializableOptions, kind: 'parquetReadObjects' }
    worker.postMessage(message)
  })
}
