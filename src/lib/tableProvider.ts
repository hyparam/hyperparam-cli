import { DataFrame, OrderBy, ResolvableRow, resolvableRow } from 'hightable'
import { FileMetaData, parquetSchema } from 'hyparquet'
import { parquetColumnRanksWorker, parquetQueryWorker } from './workers/parquetWorkerClient.js'
import type { AsyncBufferFrom } from './workers/types.d.ts'

/*
 * sortIndex[0] gives the index of the first row in the sorted table
 */
export function computeSortIndex(orderByRanks: { direction: 'ascending' | 'descending', ranks: number[] }[]): number[] {
  if (!(0 in orderByRanks)) {
    throw new Error('orderByRanks should have at least one element')
  }
  const numRows = orderByRanks[0].ranks.length
  return Array
    .from({ length: numRows }, (_, i) => i)
    .sort((a, b) => {
      for (const { direction, ranks } of orderByRanks) {
        const rankA = ranks[a]
        const rankB = ranks[b]
        if (rankA === undefined || rankB === undefined) {
          throw new Error('Invalid ranks')
        }
        const value = direction === 'ascending' ? 1 : -1
        if (rankA < rankB) return -value
        if (rankA > rankB) return value
      }
      return 0
    })
}

interface VirtualRowGroup {
  groupStart: number
  groupEnd: number
  fetching: boolean
}

/**
 * Convert a parquet file into a dataframe.
 */
export function parquetDataFrame(from: AsyncBufferFrom, metadata: FileMetaData): DataFrame {
  const { children } = parquetSchema(metadata)
  const header = children.map(child => child.element.name)
  const sortCache = new Map<string, Promise<number[]>>()
  const columnRanksCache = new Map<string, Promise<number[]>>()
  const data = new Array<ResolvableRow | undefined>(Number(metadata.num_rows))

  // virtual row groups are up to 1000 rows within row group boundaries
  const groups: VirtualRowGroup[] = []
  let groupStart = 0
  for (const rg of metadata.row_groups) {
    // make virtual row groups of size 1000
    for (let j = 0; j < rg.num_rows; j += 1000) {
      const groupSize = Math.min(1000, Number(rg.num_rows) - j)
      const groupEnd = groupStart + groupSize
      groups.push({ groupStart, groupEnd, fetching: false })
      groupStart = groupEnd
    }
  }

  function fetchVirtualRowGroup(virtualGroupIndex: number) {
    const group = groups[virtualGroupIndex]
    if (group && !group.fetching) {
      group.fetching = true
      const { groupStart, groupEnd } = group
      // Initialize with resolvable promises
      for (let i = groupStart; i < groupEnd; i++) {
        data[i] = resolvableRow(header)
        data[i]?.index.resolve(i)
      }
      parquetQueryWorker({ from, metadata, rowStart: groupStart, rowEnd: groupEnd })
        .then(groupData => {
          for (let rowIndex = groupStart; rowIndex < groupEnd; rowIndex++) {
            const dataRow = data[rowIndex]
            if (dataRow === undefined) {
              throw new Error(`Missing data row for index ${rowIndex}`)
            }
            const row = groupData[rowIndex - groupStart]
            if (row === undefined) {
              throw new Error(`Missing row in groupData for index ${rowIndex}`)
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
          const reason = `Error fetching rows ${groupStart}-${groupEnd}: ${error}`
          // reject the index of the first row (it's enough to trigger the error bar)
          data[groupStart]?.index.reject(reason)
        })
    }
  }

  function getColumnRanks(column: string): Promise<number[]> {
    let columnRanks = columnRanksCache.get(column)
    if (!columnRanks) {
      columnRanks = parquetColumnRanksWorker({ from, metadata, column })
      columnRanksCache.set(column, columnRanks)
    }
    return columnRanks
  }

  function getSortIndex(orderBy: OrderBy): Promise<number[]> {
    const orderByKey = JSON.stringify(orderBy)
    let sortIndex = sortCache.get(orderByKey)
    if (!sortIndex) {
      const orderByRanksPromise = Promise.all(
        orderBy.map(({ column, direction }) => getColumnRanks(column).then(ranks => ({ direction, ranks })))
      )
      sortIndex = orderByRanksPromise.then(orderByRanks => computeSortIndex(orderByRanks))
      sortCache.set(orderByKey, sortIndex)
    }
    return sortIndex
  }

  return {
    header,
    numRows: Number(metadata.num_rows),
    rows({ start, end, orderBy }) {
      if (orderBy?.length) {
        const numRows = end - start
        const wrapped = new Array(numRows).fill(null).map(() => resolvableRow(header))

        getSortIndex(orderBy).then(indices => {
          // Compute row groups to fetch
          for (const index of indices.slice(start, end)) {
            const groupIndex = groups.findIndex(({ groupEnd }) => index < groupEnd)
            fetchVirtualRowGroup(groupIndex)
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
          console.error('Error fetching sort index or resolving sorted rows', error)
          // Reject at least one promise to trigger the error bar
          wrapped[0]?.index.reject(`Error fetching sort index or resolving sorted rows: ${error}`)
        })

        return wrapped
      } else {
        groups.forEach(({ groupStart, groupEnd }, i) => {
          if (groupStart < end && groupEnd > start) {
            fetchVirtualRowGroup(i)
          }
        })
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
