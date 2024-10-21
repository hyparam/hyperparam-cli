import { ColumnData, parquetQuery } from 'hyparquet'
import { compressors } from 'hyparquet-compressors'
import { asyncBufferFrom, compare } from './parquetWorkerClient.js'

self.onmessage = async ({ data }) => {
  const { metadata, from, rowStart, rowEnd, orderBy, columns, queryId, chunks, sortIndex } = data
  const file = await asyncBufferFrom(from)
  const onChunk = chunks ? (chunk: ColumnData) => self.postMessage({ chunk, queryId }) : undefined
  try {
    if (sortIndex) {
      // Special case for sorted index
      if (orderBy === undefined) throw new Error('sortIndex requires orderBy')
      if (rowStart !== undefined || rowEnd !== undefined) throw new Error('sortIndex requires all rows')
      const sortColumn = await parquetQuery({
        metadata, file, columns: [orderBy], compressors
      })
      const result = Array.from(sortColumn, (_, index) => index)
        .sort((a, b) => compare(sortColumn[a][orderBy], sortColumn[b][orderBy]))
      self.postMessage({ result, queryId })
    } else {
      const result = await parquetQuery({
        metadata, file, rowStart, rowEnd, orderBy, columns, compressors, onChunk
      })
      self.postMessage({ result, queryId })
    }
  } catch (error) {
    self.postMessage({ error, queryId })
  }
}
