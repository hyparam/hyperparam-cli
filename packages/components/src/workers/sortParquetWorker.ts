import { parquetQuery } from 'hyparquet'
import { compressors } from 'hyparquet-compressors'
import { asyncBufferFrom, compare } from './parquetWorkerClient.ts'
import type {
  ErrorMessage,
  IndicesMessage,
  ParquetReadWorkerOptions,
} from './types.ts'

function postIndicesMessage ({ indices, queryId }: IndicesMessage) {
  self.postMessage({ indices, queryId })
}
function postErrorMessage ({ error, queryId }: ErrorMessage) {
  self.postMessage({ error, queryId })
}

self.onmessage = async ({
  data,
}: {
  data: ParquetReadWorkerOptions & { queryId: number; chunks: boolean };
}) => {
  const {
    metadata,
    from,
    rowStart,
    rowEnd,
    orderBy,
    queryId,
    sortIndex,
  } = data
  const file = await asyncBufferFrom(from)
  try {
    // Special case for sorted index
    if (sortIndex === undefined)
      throw new Error('sortParquetWorker requires sortIndex')
    if (orderBy === undefined)
      throw new Error('sortParquetWorker requires orderBy')
    if (rowStart !== undefined || rowEnd !== undefined)
      throw new Error('sortIndex requires all rows')
    const sortColumn = await parquetQuery({
      metadata,
      file,
      columns: [orderBy],
      compressors,
    })
    const indices = Array.from(sortColumn, (_, index) => index).sort((a, b) =>
      compare<unknown>(sortColumn[a][orderBy], sortColumn[b][orderBy]),
    )
    postIndicesMessage({ indices, queryId })
  } catch (error) {
    postErrorMessage({ error: error as Error, queryId })
  }
}
