import { DataFrame, DataFrameEvents, ResolvedValue, UnsortableDataFrame, createEventTarget, sortableDataFrame } from 'hightable'
import type { ColumnData } from 'hyparquet'
import { FileMetaData, parquetSchema, ParquetReadOptions } from 'hyparquet'
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
 */
export function parquetDataFrame(from: AsyncBufferFrom, metadata: FileMetaData, options?: Pick<ParquetReadOptions, 'utf8'>): DataFrame {
  const { children } = parquetSchema(metadata)
  const header = children.map(child => child.element.name)
  const eventTarget = createEventTarget<DataFrameEvents>()

  const cellCache = new Map<string, ResolvedValue<unknown>[]>(header.map(name => [name, []]))

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
        state: new Map(header.map(name => [name, { kind: 'unfetched' }])),
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

  const unsortableDataFrame: UnsortableDataFrame = {
    header,
    numRows,
    eventTarget,
    getRowNumber({ row }) {
      validateRow({ row, data: { numRows } })
      return { value: row }
    },
    getCell({ row, column }) {
      validateRow({ row, data: { numRows } })
      validateColumn({ column, data: { header } })
      return cellCache.get(column)?.[row]
    },
    fetch: async ({ rowStart, rowEnd, columns, signal }) => {
      validateFetchParams({ rowStart, rowEnd, columns, data: { numRows, header } })
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

  return sortableDataFrame(unsortableDataFrame)
}

function validateFetchParams({ rowStart, rowEnd, columns, data: { numRows, header } }: {rowStart: number, rowEnd: number, columns?: string[], data: Pick<DataFrame, 'numRows' | 'header'>}): void {
  if (rowStart < 0 || rowEnd > numRows || !Number.isInteger(rowStart) || !Number.isInteger(rowEnd) || rowStart > rowEnd) {
    throw new Error(`Invalid row range: ${rowStart} - ${rowEnd}, numRows: ${numRows}`)
  }
  if (columns?.some(column => !header.includes(column))) {
    throw new Error(`Invalid columns: ${columns.join(', ')}. Available columns: ${header.join(', ')}`)
  }
}
function validateRow({ row, data: { numRows } }: {row: number, data: Pick<DataFrame, 'numRows'>}): void {
  if (row < 0 || row >= numRows || !Number.isInteger(row)) {
    throw new Error(`Invalid row index: ${row}, numRows: ${numRows}`)
  }
}
function validateColumn({ column, data: { header } }: {column: string, data: Pick<DataFrame, 'header'>}): void {
  if (!header.includes(column)) {
    throw new Error(`Invalid column: ${column}. Available columns: ${header.join(', ')}`)
  }
}
function checkSignal(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new DOMException('The operation was aborted.', 'AbortError')
  }
}
