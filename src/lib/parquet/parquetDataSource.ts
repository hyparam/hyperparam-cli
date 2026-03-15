import { parquetReadObjects, parquetSchema } from 'hyparquet'
import type { AsyncBuffer, Compressors, FileMetaData } from 'hyparquet'
import type { AsyncDataSource, AsyncRow, ScanOptions, SqlPrimitive } from 'squirreling'
import { whereToParquetFilter } from './parquetFilter.js'

/**
 * Creates a parquet data source for use with squirreling SQL engine.
 */
export function parquetDataSource(file: AsyncBuffer, metadata: FileMetaData, compressors: Compressors): AsyncDataSource {
  const schema = parquetSchema(metadata)
  return {
    columns: schema.children.map(child => child.element.name),
    scan({ columns, where, limit, offset, signal }: ScanOptions) {
      // Convert WHERE AST to hyparquet filter format
      const whereFilter = where && whereToParquetFilter(where)
      const filter = where ? whereFilter : undefined
      const appliedWhere = Boolean(filter && whereFilter)
      const appliedLimitOffset = !where || appliedWhere

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
              yield asyncRow(row)
            }

            remainingLimit -= data.length
            groupStart += rowCount
          }
        })(),
        appliedWhere,
        appliedLimitOffset,
      }
    },
  }
}

function asyncRow(obj: Record<string, SqlPrimitive>): AsyncRow {
  const cells: Record<string, () => Promise<SqlPrimitive>> = {}
  for (const [key, value] of Object.entries(obj)) {
    cells[key] = () => Promise.resolve(value)
  }
  return { columns: Object.keys(obj), cells }
}
