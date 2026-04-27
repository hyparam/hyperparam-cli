import type { ColumnData } from 'hyparquet'
import type { SubColumnData } from 'hyparquet/src/types.js'
import ParquetWorker from './parquetWorker?worker&inline'
import type { ClientMessage, ParquetQueryWorkerOptions, ParquetReadObjectsWorkerOptions, ParquetReadWorkerOptions, Rows, WorkerMessage } from './types.js'
/// ^ the worker is bundled with the main thread code (inline) which is easier for users to import
/// (no need to copy the worker file to the right place)

let worker: Worker | undefined
let nextQueryId = 0
interface Agent {
  onComplete?: ((rows: Rows) => void)
  onChunk?: (chunk: ColumnData) => void
  onPage?: (page: SubColumnData) => void
  reject: (error: Error) => void
  parquetReadResolve?: () => void
  parquetReadObjectsResolve?: (rows: Rows) => void
  parquetQueryResolve?: (rows: Rows) => void
}

const pendingAgents = new Map<number, Agent>()

function getWorker() {
  if (!worker) {
    worker = new ParquetWorker()
    worker.onmessage = ({ data }: { data: WorkerMessage }) => {
      const pendingAgent = pendingAgents.get(data.queryId)
      if (!pendingAgent) {
        console.warn(
          `Unexpected: no pending promise found for queryId: ${data.queryId.toString()}`
        )
        return
      }

      const { onComplete, onChunk, onPage, reject, parquetReadResolve, parquetReadObjectsResolve, parquetQueryResolve } = pendingAgent
      switch (data.kind) {
        case 'onComplete':
          onComplete?.(data.rows)
          break
        case 'onChunk':
          onChunk?.(data.chunk)
          break
        case 'onPage':
          onPage?.(data.page)
          break
        default:
          switch (data.kind) {
            case 'onReject':
              if ('error' in data) { // check, just in case
                reject(data.error)
              }
              break
            case 'onParquetReadResolve':
              parquetReadResolve?.()
              break
            case 'onParquetReadObjectsResolve':
              parquetReadObjectsResolve?.(data.rows)
              break
            case 'onParquetQueryResolve':
              parquetQueryResolve?.(data.rows)
              break
          }
          /* clean up */
          pendingAgents.delete(data.queryId)
          // TODO(SL): maybe terminate the worker when no pending agents left
      }
    }
  }
  return worker
}

/** Wires an AbortSignal to the queryId: posts an abort message to the worker
 * and rejects the promise. The worker will suppress the result for this id. */
function wireAbort(worker: Worker, queryId: number, signal: AbortSignal | undefined, reject: (e: Error) => void): boolean {
  if (!signal) return false
  if (signal.aborted) {
    pendingAgents.delete(queryId)
    worker.postMessage({ queryId, kind: 'abort' } satisfies ClientMessage)
    reject(new DOMException('Aborted', 'AbortError'))
    return true
  }
  signal.addEventListener('abort', () => {
    if (!pendingAgents.has(queryId)) return
    pendingAgents.delete(queryId)
    worker.postMessage({ queryId, kind: 'abort' } satisfies ClientMessage)
    reject(new DOMException('Aborted', 'AbortError'))
  }, { once: true })
  return false
}

/**
 * Presents almost the same interface as parquetRead, but runs in a worker.
 * This is useful for reading large parquet files without blocking the main thread.
 * Instead of taking an AsyncBuffer, it takes a AsyncBufferFrom, because it needs
 * to be serialized to the worker. Also: the worker uses hyparquet-compressors and
 * the default parsers.
 *
 * Note that it only supports 'rowFormat: object' (the default).
 */
export function parquetReadWorker(options: ParquetReadWorkerOptions): Promise<void> {
  const { onComplete, onChunk, onPage, from, signal, ...serializableOptions } = options
  return new Promise((resolve, reject) => {
    const queryId = nextQueryId++
    pendingAgents.set(queryId, { parquetReadResolve: resolve, reject, onComplete, onChunk, onPage })
    const worker = getWorker()
    if (wireAbort(worker, queryId, signal, reject)) return
    const message: ClientMessage = { queryId, from, kind: 'parquetRead', options: serializableOptions }
    worker.postMessage(message)
  })
}

/**
 * Presents almost the same interface as parquetReadObjects, but runs in a worker.
 * This is useful for reading large parquet files without blocking the main thread.
 * Instead of taking an AsyncBuffer, it takes a AsyncBufferFrom, because it needs
 * to be serialized to the worker. Also: the worker uses hyparquet-compressors and
 * the default parsers.
 *
 * Note that it only supports 'rowFormat: object' (the default).
 */
export function parquetReadObjectsWorker(options: ParquetReadObjectsWorkerOptions): Promise<Rows> {
  const { onChunk, onPage, from, signal, ...serializableOptions } = options
  return new Promise((resolve, reject) => {
    const queryId = nextQueryId++
    pendingAgents.set(queryId, { parquetReadObjectsResolve: resolve, reject, onChunk, onPage })
    const worker = getWorker()
    if (wireAbort(worker, queryId, signal, reject)) return
    const message: ClientMessage = { queryId, from, kind: 'parquetReadObjects', options: serializableOptions }
    worker.postMessage(message)
  })
}

/**
 * Presents almost the same interface as parquetQuery, but runs in a worker.
 * This is useful for reading large parquet files without blocking the main thread.
 * Instead of taking an AsyncBuffer, it takes a AsyncBufferFrom, because it needs
 * to be serialized to the worker. Also: the worker uses hyparquet-compressors and
 * the default parsers.
 *
 * Note that it only supports 'rowFormat: object' (the default).
 */
export function parquetQueryWorker(options: ParquetQueryWorkerOptions): Promise<Rows> {
  const { onComplete, onChunk, onPage, from, signal, ...serializableOptions } = options
  return new Promise((resolve, reject) => {
    const queryId = nextQueryId++
    pendingAgents.set(queryId, { parquetQueryResolve: resolve, reject, onComplete, onChunk, onPage })
    const worker = getWorker()
    if (wireAbort(worker, queryId, signal, reject)) return
    const message: ClientMessage = { queryId, from, kind: 'parquetQuery', options: serializableOptions }
    worker.postMessage(message)
  })
}
