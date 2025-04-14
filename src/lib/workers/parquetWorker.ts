import { ColumnData, parquetRead, parquetReadObjects } from 'hyparquet'
import { compressors } from 'hyparquet-compressors'
import { getParquetColumn } from '../getParquetColumn.js'
import { asyncBufferFrom } from '../utils.js'
import type { ChunkMessage, ClientMessage, ColumnRanksMessage, ErrorMessage, ResultMessage } from './types.js'

function postChunkMessage ({ chunk, queryId }: ChunkMessage) {
  self.postMessage({ chunk, queryId })
}
function postResultMessage ({ result, queryId }: ResultMessage) {
  self.postMessage({ result, queryId })
}
function postErrorMessage ({ error, queryId }: ErrorMessage) {
  self.postMessage({ error, queryId })
}
function postColumnRanksMessage ({ columnRanks, queryId }: ColumnRanksMessage) {
  self.postMessage({ columnRanks, queryId })
}

self.onmessage = async ({ data }: { data: ClientMessage }) => {
  const { metadata, from, kind, queryId } = data
  const file = await asyncBufferFrom(from)
  if (kind === 'columnRanks') {
    const { column } = data
    // return the column ranks in ascending order
    // we can get the descending order replacing the rank with numRows - rank - 1. It's not exactly the rank of
    // the descending order, because the rank is the first, not the last, of the ties. But it's enough for the
    // purpose of sorting.

    try {
      const sortColumn = await getParquetColumn({ metadata, file, column, compressors })
      const valuesWithIndex = sortColumn.map((value, index) => ({ value, index }))
      const sortedValuesWithIndex = Array.from(valuesWithIndex).sort(({ value: a }, { value: b }) => compare<unknown>(a, b))
      const numRows = sortedValuesWithIndex.length
      const columnRanks = sortedValuesWithIndex.reduce((accumulator, currentValue, rank) => {
        const { lastValue, lastRank, ranks } = accumulator
        const { value, index } = currentValue
        if (value === lastValue) {
          ranks[index] = lastRank
          return { ranks, lastValue, lastRank }
        } else {
          ranks[index] = rank
          return { ranks, lastValue: value, lastRank: rank }
        }
      }, {
        ranks: Array(numRows).fill(-1) as number[],
        lastValue: undefined as unknown,
        lastRank: 0,
      }).ranks
      postColumnRanksMessage({ columnRanks, queryId })
    } catch (error) {
      postErrorMessage({ error: error as Error, queryId })
    }
  } else if (data.chunks) {
    function onChunk(chunk: ColumnData) { postChunkMessage({ chunk, queryId }) }
    const { rowStart, rowEnd } = data
    try {
      await parquetRead({ metadata, file, rowStart, rowEnd, compressors, onChunk })
    } catch (error) {
      postErrorMessage({ error: error as Error, queryId })
    }
  } else {
    const { rowStart, rowEnd } = data
    try {
      const result = await parquetReadObjects({ metadata, file, rowStart, rowEnd, compressors })
      postResultMessage({ result, queryId })
    } catch (error) {
      postErrorMessage({ error: error as Error, queryId })
    }
  }
}

function compare<T>(a: T, b: T): number {
  if (a < b) return -1
  if (a > b) return 1
  return 1 // TODO: how to handle nulls?
}
