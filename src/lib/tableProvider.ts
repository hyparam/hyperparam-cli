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
  const groups = new Array(metadata.row_groups.length).fill(false)
  let groupStart = 0
  const groupEnds = metadata.row_groups.map(group => groupStart += Number(group.num_rows))

  function fetchRowGroup(groupIndex: number) {
    if (!groups[groupIndex]) {
      const rowStart = groupEnds[groupIndex - 1] ?? 0
      const rowEnd = groupEnds[groupIndex]
      if (rowEnd === undefined) {
        throw new Error(`Missing groupEnd for groupIndex: ${groupIndex}`)
      }
      // Initialize with resolvable promises
      for (let i = rowStart; i < rowEnd; i++) {
        data[i] = resolvableRow(header)
      }
      parquetQueryWorker({ from, metadata, rowStart, rowEnd })
        .then((groupData) => {
          for (let i = rowStart; i < rowEnd; i++) {
            const dataRow = data[i]
            if (dataRow === undefined) {
              throw new Error(`Missing data row for index ${i}`)
            }
            dataRow.index.resolve(i)
            const row = groupData[i - rowStart]
            if (row === undefined) {
              throw new Error(`Missing row in groupData for index: ${i - rowStart}`)
            }
            for (const [key, value] of Object.entries(row)) {
              const cell = dataRow.cells[key]
              if (cell === undefined) {
                throw new Error(`Missing column in dataRow for column ${key}`)
              }
              cell.resolve(value)
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
    rows({ start, end, orderBy }: { start: number, end: number, orderBy?: string}) {
      if (orderBy) {
        const numRows = end - start
        const wrapped = new Array(numRows).fill(null).map(() => resolvableRow(header))

        getSortIndex(orderBy).then(indices => {
          // Compute row groups to fetch
          for (const index of indices.slice(start, end)) {
            const groupIndex = groupEnds.findIndex(end => index < end)
            fetchRowGroup(groupIndex)
          }

          // Re-assemble data in sorted order into wrapped
          for (let i = start; i < end; i++) {
            const index = indices[i]
            if (index === undefined) {
              throw new Error(`index ${i} not found in indices`)
            }
            const row = data[index]
            if (row === undefined) {
              throw new Error('Row not fetched')
            }
            const { cells } = row
            const wrappedRow = wrapped[i - start]
            if (wrappedRow === undefined) {
              throw new Error(`Wrapped row missing at index ${i - start}`)
            }
            wrappedRow.index.resolve(index)
            for (const key of header) {
              const cell = cells[key]
              if (cell) {
                // TODO(SL): should we remove this check? It makes sense only if header change
                // but if so, I guess we will have more issues
                cell
                  .then((value: unknown) => {
                    const wrappedCell = wrappedRow.cells[key]
                    if (wrappedCell === undefined) {
                      throw new Error(`Wrapped cell not found for column ${key}`)
                    }
                    wrappedCell.resolve(value)
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
            error
          )
        })

        return wrapped
      } else {
        for (let i = 0; i < groups.length; i++) {
          const groupStart = groupEnds[i - 1] ?? 0
          const groupEnd = groupEnds[i]
          if (groupEnd === undefined) {
            throw new Error(`Missing group end at index ${i}`)
          }
          if (start < groupEnd && end > groupStart) {
            fetchRowGroup(i)
          }
        }
        const wrapped = data.slice(start, end)
        if (wrapped.some(row => row === undefined)) {
          throw new Error('Row not fetched')
        }
        return wrapped as ResolvableRow[]
      }
    },
    sortable: true,
    // TODO(SL): implement getColumn({column, start, end}): any[]
  }
}
