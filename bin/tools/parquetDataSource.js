import { parquetSchema } from 'hyparquet'
import { parquetPlan } from 'hyparquet/src/plan.js'
import { asyncGroupToRows, readRowGroup } from 'hyparquet/src/rowgroup.js'
import { whereToParquetFilter } from './parquetFilter.js'

/**
 * @import { AsyncBuffer, Compressors, FileMetaData } from 'hyparquet'
 * @import { AsyncDataSource } from 'squirreling'
 * @import { AsyncCells } from 'squirreling/src/types.js'
 */

/**
 * Creates a parquet data source for use with squirreling SQL engine.
 *
 * @param {AsyncBuffer} file
 * @param {FileMetaData} metadata
 * @param {Compressors} compressors
 * @returns {AsyncDataSource}
 */
export function parquetDataSource(file, metadata, compressors) {
  return {
    async *scan(hints) {
      const options = {
        file,
        metadata,
        compressors,
        columns: hints?.columns,
        // convert WHERE clause to parquet pushdown filter
        filter: whereToParquetFilter(hints?.where),
        filterStrict: false,
      }

      // TODO: check that columns exist in parquet file
      let { columns } = options
      if (!columns?.length) {
        const schema = parquetSchema(metadata)
        columns = schema.children.map(col => col.element.name)
      }

      const plan = parquetPlan(options)
      for (const subplan of plan.groups) {
        // Read row group
        const rg = readRowGroup(options, plan, subplan)
        // Transpose to materialized rows
        const rows = await asyncGroupToRows(rg, 0, rg.groupRows, undefined, 'object')
        // Convert to AsyncRow generator
        for (const row of rows) {
          /** @type {AsyncCells} */
          const cells = {}
          for (const [key, value] of Object.entries(row)) {
            cells[key] = () => Promise.resolve(value)
          }
          yield { columns, cells }
        }
      }
    },
  }
}
