import { DataFrame, DataFrameEvents, ResolvedValue, checkSignal, createEventTarget, validateFetchParams, validateGetCellParams, validateGetRowNumberParams } from 'hightable'
import type { ColumnData } from 'hyparquet'
import { FileMetaData, ParquetReadOptions, parquetSchema } from 'hyparquet'
import { parquetReadWorker } from './workers/parquetWorkerClient.js'
import type { AsyncBufferFrom } from './workers/types.d.ts'

type GroupStatus = {
  kind: 'unfetched'
} | {
  kind: 'fetching'
  promise: Promise<void>
} | {
  kind: 'fetched'
}
interface VirtualRowGroup {
  groupStart: number
  groupEnd: number
  state: Map<string, GroupStatus>
}

/**
 * Convert a parquet file into a dataframe.
 *
 * It fetches data on demand in chunks of 1000 rows within each row group.
 * It's not sortable. You can use sortableDataFrame from hightable to make it sortable.
 */
export function parquetDataFrame(from: AsyncBufferFrom, metadata: FileMetaData, options?: Pick<ParquetReadOptions, 'utf8'>): DataFrame<{parquet: FileMetaData}> {
  const { children } = parquetSchema(metadata)
  const columnDescriptors = children.map(child => ({ name: child.element.name }))
  const eventTarget = createEventTarget<DataFrameEvents>()

  const cellCache = new Map<string, ResolvedValue<unknown>[]>(columnDescriptors.map(({ name }) => [name, []]))

  // virtual row groups are up to 1000 rows within row group boundaries
  const groups: VirtualRowGroup[] = []
  let groupStart = 0
  for (const rg of metadata.row_groups) {
    // make virtual row groups of size 1000
    for (let j = 0; j < rg.num_rows; j += 1000) {
      const groupSize = Math.min(1000, Number(rg.num_rows) - j)
      const groupEnd = groupStart + groupSize
      groups.push({
        groupStart,
        groupEnd,
        state: new Map(columnDescriptors.map(({ name }) => [name, { kind: 'unfetched' }])),
      })
      groupStart = groupEnd
    }
  }

  async function fetchVirtualRowGroup({ group, columns }: {
    group: VirtualRowGroup, columns: string[]
  }): Promise<void> {
    const { groupStart, groupEnd, state } = group
    const columnsToFetch = columns.filter(column => state.get(column)?.kind === 'unfetched')
    const promises = [...group.state.values()].filter((status): status is { kind: 'fetching', promise: Promise<void> } => status.kind === 'fetching').map(status => status.promise)

    // TODO(SL): pass AbortSignal to the worker?
    if (columnsToFetch.length > 0) {
      const commonPromise = parquetReadWorker({ ...options, from, metadata, rowStart: groupStart, rowEnd: groupEnd, columns: columnsToFetch, onChunk })
      columnsToFetch.forEach(column => {
        state.set(column, { kind: 'fetching', promise: commonPromise })
      })
      promises.push(commonPromise)
    }
    await Promise.all(promises)

    columnsToFetch.forEach(column => {
      state.set(column, { kind: 'fetched' })
    })

  }

  function onChunk(chunk: ColumnData): void {
    const { columnName, columnData, rowStart } = chunk
    const cachedColumn = cellCache.get(columnName)
    if (!cachedColumn) {
      throw new Error(`Column "${columnName}" not found in header`)
    }
    let row = rowStart
    for (const value of columnData) {
      cachedColumn[row] ??= { value }
      row++
    }
    eventTarget.dispatchEvent(new CustomEvent('resolve'))
  }

  const numRows = Number(metadata.num_rows)

  const unsortableDataFrame: DataFrame<{parquet: FileMetaData}> = {
    columnDescriptors,
    numRows,
    metadata: { parquet: metadata },
    eventTarget,
    getRowNumber({ row, orderBy }) {
      validateGetRowNumberParams({ row, orderBy, data: { numRows, columnDescriptors } })
      return { value: row }
    },
    getCell({ row, column, orderBy }) {
      validateGetCellParams({ row, column, orderBy, data: { numRows, columnDescriptors } })
      return cellCache.get(column)?.[row]
    },
    fetch: async ({ rowStart, rowEnd, columns, signal }) => {
      validateFetchParams({ rowStart, rowEnd, columns, data: { numRows, columnDescriptors } })
      checkSignal(signal)

      if (!columns || columns.length === 0) {
        return
      }

      const promises: Promise<void>[] = []

      groups.forEach((group) => {
        const { groupStart, groupEnd } = group
        if (groupStart < rowEnd && groupEnd > rowStart) {
          promises.push(
            fetchVirtualRowGroup({
              group,
              columns,
            }).then(() => {
              checkSignal(signal)
            })
          )
        }
      })

      await Promise.all(promises)
    },
  }

  return unsortableDataFrame
}
