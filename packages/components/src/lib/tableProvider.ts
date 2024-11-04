import { DataFrame, resolvableRow } from 'hightable'
import { FileMetaData, parquetSchema } from 'hyparquet'
import { AsyncBufferFrom, parquetQueryWorker, parquetSortIndexWorker } from '../workers/parquetWorkerClient.js'

/**
 * Convert a parquet file into a dataframe.
 */
export function parquetDataFrame(from: AsyncBufferFrom, metadata: FileMetaData): DataFrame {
  const { children } = parquetSchema(metadata)
  const header = children.map(child => child.element.name)
  const sortCache = new Map<string, Promise<number[]>>()
  const data = new Array(Number(metadata.num_rows))
  const groups = new Array(metadata.row_groups.length).fill(false)
  let groupStart = 0
  const groupEnds = metadata.row_groups.map(group => groupStart += Number(group.num_rows))

  function fetchRowGroup(groupIndex: number) {
    if (!groups[groupIndex]) {
      const rowStart = groupEnds[groupIndex - 1] || 0
      const rowEnd = groupEnds[groupIndex]
      // Initialize with resolvable promises
      for (let i = rowStart; i < rowEnd; i++) {
        data[i] = resolvableRow(header)
      }
      parquetQueryWorker({ from, metadata, rowStart, rowEnd }).then(groupData => {
        for (let i = rowStart; i < rowEnd; i++) {
          for (const [key, value] of Object.entries(groupData[i - rowStart])) {
            data[i][key].resolve(value)
          }
        }
      })
      groups[groupIndex] = true
    }
  }

  function getSortIndex(orderBy: string) {
    let sortIndex = sortCache.get(orderBy)
    if (!sortIndex) {
      sortIndex = parquetSortIndexWorker({ from, metadata, orderBy })
      sortCache.set(orderBy, sortIndex)
    }
    return sortIndex
  }

  return {
    header,
    numRows: Number(metadata.num_rows),
    rows(rowStart: number, rowEnd: number, orderBy?: string) {
      if (orderBy) {
        const numRows = rowEnd - rowStart
        const wrapped = new Array(numRows).fill(null)
          .map(() => resolvableRow(header))

        let sortIndex = getSortIndex(orderBy)
        sortIndex.then(indices => {
          // Compute row groups to fetch
          for (const index of indices.slice(rowStart, rowEnd)) {
            const groupIndex = groupEnds.findIndex(end => index < end)
            fetchRowGroup(groupIndex)
          }

          // Re-assemble data in sorted order into wrapped
          for (let i = rowStart; i < rowEnd; i++) {
            for (const key of header) {
              data[indices[i]][key].then((value: any) => wrapped[i - rowStart][key].resolve(value))
            }
          }
        })

        return wrapped
      } else {
        for (let i = 0; i < groups.length; i++) {
          const groupStart = groupEnds[i - 1] || 0
          if (rowStart < groupEnds[i] && rowEnd > groupStart) {
            fetchRowGroup(i)
          }
        }
        return data.slice(rowStart, rowEnd)
      }
    },
    sortable: true,
  }
}
