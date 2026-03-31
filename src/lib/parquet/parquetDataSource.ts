import { parquetReadObjects, parquetSchema } from 'hyparquet'
import { parquetReadAsync } from 'hyparquet/src/read.js'
import { assembleAsync } from 'hyparquet/src/rowgroup.js'
import type { AsyncBuffer, AsyncRowGroup, Compressors, FileMetaData } from 'hyparquet'
import { AsyncDataSource, ScanOptions, asyncRow } from 'squirreling'
import { whereToParquetFilter } from './parquetFilter.js'
import { extractSpatialFilter, rowGroupOverlaps } from './parquetSpatial.js'

/**
 * Creates a parquet data source for use with squirreling SQL engine.
 */
export function parquetDataSource(file: AsyncBuffer, metadata: FileMetaData, compressors: Compressors): AsyncDataSource {
  const schema = parquetSchema(metadata)
  return {
    numRows: Number(metadata.num_rows),
    columns: schema.children.map(child => child.element.name),
    scan({ columns, where, limit, offset, signal }: ScanOptions) {
      // Convert WHERE AST to hyparquet filter format
      const whereFilter = where && whereToParquetFilter(where)
      const filter = where ? whereFilter : undefined
      const appliedWhere = Boolean(filter && whereFilter)
      const appliedLimitOffset = !where || appliedWhere

      // Extract spatial filter for row group pruning
      const spatialFilter = extractSpatialFilter(where)

      // Ensure columns exist in metadata if provided
      if (columns) {
        for (const col of columns) {
          if (!schema.children.some(child => child.element.name === col)) {
            throw new Error(`Column "${col}" not found in parquet schema`)
          }
        }
      }

      return {
        rows: (async function* () {
          // Emit rows by row group
          let groupStart = 0
          let remainingLimit = limit ?? Infinity
          for (const rowGroup of metadata.row_groups) {
            if (signal?.aborted) break
            const rowCount = Number(rowGroup.num_rows)

            // Skip row groups using geospatial statistics
            if (spatialFilter && !rowGroupOverlaps(rowGroup, spatialFilter)) {
              groupStart += rowCount
              continue
            }

            // Skip row groups by offset if where is fully applied
            let safeOffset = 0
            let safeLimit = rowCount
            if (appliedLimitOffset) {
              if (offset !== undefined && groupStart < offset) {
                safeOffset = Math.min(rowCount, offset - groupStart)
              }
              safeLimit = Math.min(rowCount - safeOffset, remainingLimit)
              if (safeLimit <= 0 && safeOffset < rowCount) break
            }
            if (safeOffset === rowCount) {
              groupStart += rowCount
              continue
            }

            // Read objects from this row group
            const data = await parquetReadObjects({
              file,
              metadata,
              rowStart: groupStart + safeOffset,
              rowEnd: groupStart + safeOffset + safeLimit,
              columns,
              filter,
              filterStrict: false,
              compressors,
              useOffsetIndex: true,
            })

            // Yield each row
            for (const row of data) {
              yield asyncRow(row, Object.keys(row))
            }

            remainingLimit -= data.length
            groupStart += rowCount
          }
        })(),
        appliedWhere,
        appliedLimitOffset,
      }
    },

    async *scanColumn({ column, limit, offset, signal }) {
      const rowStart = offset ?? 0
      const rowEnd = limit !== undefined ? rowStart + limit : undefined
      const asyncGroups = parquetReadAsync({
        file,
        metadata,
        rowStart,
        rowEnd,
        columns: [column],
        compressors,
      })
      const schemaTree = parquetSchema(metadata)
      const assembled = asyncGroups.map((arg: AsyncRowGroup) => assembleAsync(arg, schemaTree))

      for (const rg of assembled) {
        if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
        const [firstCol] = rg.asyncColumns
        if (!firstCol) continue
        const { skipped, data } = await firstCol.data
        if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
        let dataStart = rg.groupStart + skipped
        for (const page of data) {
          const pageRows = page.length
          const selectStart = Math.max(rowStart - dataStart, 0)
          const selectEnd = Math.min((rowEnd ?? Infinity) - dataStart, pageRows)
          if (selectEnd > selectStart) {
            yield selectStart > 0 || selectEnd < pageRows
              ? page.slice(selectStart, selectEnd)
              : page
          }
          dataStart += pageRows
        }
      }
    },
  }
}
