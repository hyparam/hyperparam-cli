import type { ColumnData } from 'hyparquet'
import type { ClientMessage, WorkerMessage, WorkerOptions } from './types.js'

let worker: Worker | undefined
let nextQueryId = 0
interface QueryAgent {
  resolve: () => void
  reject: (error: Error) => void
  onChunk: (chunk: ColumnData) => void
}

const pending = new Map<number, QueryAgent>()

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL('./parquetWorker.js', import.meta.url), { type: 'module' })
    worker.onmessage = ({ data }: { data: WorkerMessage }) => {
      const pendingQueryAgent = pending.get(data.queryId)
      if (!pendingQueryAgent) {
        console.warn(
          `Unexpected: no pending promise found for queryId: ${data.queryId.toString()}`
        )
        return
      }

      const { onChunk, resolve, reject } = pendingQueryAgent
      if ('error' in data) {
        reject(data.error)
      } else if ('chunk' in data) {
        onChunk(data.chunk)
      } else {
        resolve()
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
export function parquetQueryWorker({ metadata, from, rowStart, rowEnd, columns, onChunk }: WorkerOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const queryId = nextQueryId++
    pending.set(queryId, { resolve, reject, onChunk })
    const worker = getWorker()
    const message: ClientMessage = { queryId, metadata, from, rowStart, rowEnd, columns }
    worker.postMessage(message)
  })
}
