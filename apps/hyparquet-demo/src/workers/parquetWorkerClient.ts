import ParquetWorker from './parquetWorker?worker&inline'
/// ^ the worker is bundled with the main thread code (inline) which is easier for users to import
/// (no need to copy the worker file to the right place)
import { ColumnData } from 'hyparquet'
import type { ParquetMessage, ParquetReadWorkerOptions, Row } from './types.d.ts'

let worker: Worker | undefined
let nextQueryId = 0
interface QueryAgent {
  resolve: (value: Row[]) => void;
  reject: (error: Error) => void;
  onChunk?: (chunk: ColumnData) => void;
}
const pending = new Map<number, QueryAgent>()

function getWorker() {
  if (!worker) {
    worker = new ParquetWorker()
    worker.onmessage = ({ data }: { data: ParquetMessage }) => {
      const pendingQueryAgent = pending.get(data.queryId)
      if (!pendingQueryAgent) {
        console.warn(
          `Unexpected: no pending promise found for queryId: ${data.queryId.toString()}`,
        )
        return
      }
      const { resolve, reject, onChunk } = pendingQueryAgent
      if ('error' in data) {
        reject(data.error)
      } else if ('result' in data) {
        resolve(data.result)
      } else if ('chunk' in data) {
        onChunk?.(data.chunk)
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
export function parquetQueryWorker(
  { metadata, from, rowStart, rowEnd, orderBy, onChunk }: ParquetReadWorkerOptions,
): Promise<Row[]> {
  return new Promise((resolve, reject) => {
    const queryId = nextQueryId++
    pending.set(queryId, { resolve, reject, onChunk })
    const worker = getWorker()

    // If caller provided an onChunk callback, worker will send chunks as they are parsed
    const chunks = onChunk !== undefined
    worker.postMessage({
      queryId, metadata, from, rowStart, rowEnd, orderBy, chunks,
    })
  })
}
