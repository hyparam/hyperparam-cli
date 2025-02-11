import { DataFrame, ResolvableRow, resolvableRow } from 'hightable'
import { FileMetaData, parquetSchema } from 'hyparquet'
import { parquetQueryWorker, parquetSortIndexWorker } from './workers/parquetWorkerClient.js'
import type { AsyncBufferFrom } from './workers/types.d.ts'

/**
 * Convert a parquet file into a dataframe.
 */
export function parquetDataFrame(from: AsyncBufferFrom, metadata: FileMetaData): DataFrame {
  const { children } = parquetSchema(metadata)
  const header = children.map(child => child.element.name)
  const sortCache = new Map<string, Promise<number[]>>()
  const data = new Array<ResolvableRow | undefined>(Number(metadata.num_rows))
  /// ^ warning: the type is a lie at that point, because all rows are undefined for now
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
      parquetQueryWorker({ from, metadata, rowStart, rowEnd })
        .then((groupData) => {
          for (let i = rowStart; i < rowEnd; i++) {
            data[i]?.index.resolve(i)
            for (const [key, value] of Object.entries(
              groupData[i - rowStart],
            )) {
              data[i]?.cells[key].resolve(value)
            }
          }
        })
        .catch((error: unknown) => {
          console.error('Error fetching row group', error)
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
        const wrapped = new Array(numRows).fill(null).map(() => resolvableRow(header))

        getSortIndex(orderBy).then(indices => {
          // Compute row groups to fetch
          for (const index of indices.slice(rowStart, rowEnd)) {
            const groupIndex = groupEnds.findIndex(end => index < end)
            fetchRowGroup(groupIndex)
          }

          // Re-assemble data in sorted order into wrapped
          for (let i = rowStart; i < rowEnd; i++) {
            const index = indices[i]
            const row = data[index]
            if (row === undefined) {
              throw new Error('Row not fetched')
            }
            const { cells } = row
            wrapped[i - rowStart].index.resolve(index)
            for (const key of header) {
              if (key in cells) {
                // TODO(SL): should we remove this check? It makes sense only if header change
                // but if so, I guess we will have more issues
                cells[key]
                  .then((value: unknown) => {
                    wrapped[i - rowStart]?.cells[key].resolve(value)
                  })
                  .catch((error: unknown) => {
                    console.error('Error resolving sorted row', error)
                  })
              }
            }
          }
        }).catch((error: unknown) => {
          console.error(
            'Error fetching sort index or resolving sorted rows',
            error,
          )
        })

        return wrapped
      } else {
        for (let i = 0; i < groups.length; i++) {
          const groupStart = groupEnds[i - 1] || 0
          if (rowStart < groupEnds[i] && rowEnd > groupStart) {
            fetchRowGroup(i)
          }
        }
        const wrapped = data.slice(rowStart, rowEnd)
        if (wrapped.some(row => row === undefined)) {
          throw new Error('Row not fetched')
        }
        return wrapped as ResolvableRow[]
      }
    },
    sortable: true,
  }
}
