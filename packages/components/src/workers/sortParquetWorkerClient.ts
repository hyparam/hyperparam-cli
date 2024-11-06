import SortParquetWorker from './sortParquetWorker?worker&inline'
/// ^ the worker is bundled with the main thread code (inline) which is easier for users to import
/// (no need to copy the worker file to the right place)
import type {
  ParquetSortIndexOptions,
  SortParquetMessage,
} from './types.ts'

let worker: Worker | undefined
let nextQueryId = 0
interface QueryAgent {
  resolve: (value: number[]) => void;
  reject: (error: Error) => void;
}
const pending = new Map<number, QueryAgent>()

function getWorker() {
  if (!worker) {
    worker = new SortParquetWorker()
    worker.onmessage = ({ data }: { data: SortParquetMessage }) => {
      const pendingQueryAgent = pending.get(data.queryId)
      if (!pendingQueryAgent) {
        throw new Error(
          `Unexpected: no pending promise found for queryId: ${data.queryId.toString()}`,
        )
        // TODO(SL): should never happen. But if it does, I'm not sure if throwing an error here helps.
      }
      const { resolve, reject } = pendingQueryAgent
      if ('error' in data) {
        reject(data.error)
      } else if ('indices' in data) {
        resolve(data.indices)
      } else {
        reject(new Error('Unexpected message from worker'))
      }
    }
  }
  return worker
}

export function parquetSortIndexWorker({ metadata, from, orderBy }: ParquetSortIndexOptions): Promise<number[]> {
  return new Promise((resolve, reject) => {
    const queryId = nextQueryId++
    pending.set(queryId, { resolve, reject })
    const worker = getWorker()
    worker.postMessage({
      queryId, metadata, from, orderBy, sortIndex: true,
    })
  })
}
