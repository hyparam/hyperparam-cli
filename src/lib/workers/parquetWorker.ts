import { ColumnData, parquetQuery } from 'hyparquet'
import { compressors } from 'hyparquet-compressors'
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

    // TODO(SL): ensure only the expected column is fetched
    try {
      const sortColumn = await parquetQuery({ metadata, file, columns: [column], compressors })
      const valuesWithIndex = sortColumn.map((row, index) => ({ value: row[column] as unknown, index }))
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
      postColumnRanksMessage({ columnRanks: columnRanks, queryId })
    } catch (error) {
      postErrorMessage({ error: error as Error, queryId })
    }
  } else {
    const { rowStart, rowEnd, chunks } = data
    const onChunk = chunks ? (chunk: ColumnData) => { postChunkMessage({ chunk, queryId }) } : undefined
    try {
      const result = await parquetQuery({ metadata, file, rowStart, rowEnd, compressors, onChunk })
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
