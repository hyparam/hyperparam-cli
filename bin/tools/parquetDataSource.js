import { parquetPlan } from 'hyparquet/src/plan.js'
import { asyncGroupToRows, readRowGroup } from 'hyparquet/src/rowgroup.js'
import { whereToParquetFilter } from './parquetFilter.js'

/**
 * @import { AsyncBuffer, FileMetaData } from 'hyparquet'
 * @import { AsyncDataSource, AsyncRow } from 'squirreling'
 */

/**
 * Creates a parquet data source for use with squirreling SQL engine.
 *
 * @param {AsyncBuffer} file
 * @param {FileMetaData} metadata
 * @param {import('hyparquet-compressors').Compressors} compressors
 * @returns {AsyncDataSource}
 */
export function parquetDataSource(file, metadata, compressors) {
  return {
    async *getRows(hints) {
      const options = {
        file,
        metadata,
        compressors,
        columns: hints?.columns,
        filter: whereToParquetFilter(hints?.where),
      }
      const plan = parquetPlan(options)
      let count = 0
      for (const subplan of plan.groups) {
        const rg = readRowGroup(options, plan, subplan)
        const rows = await asyncGroupToRows(rg, 0, rg.groupRows, undefined, 'object')
        for (const asyncRow of rows) {
          /** @type {AsyncRow} */
          const row = {}
          for (const [key, value] of Object.entries(asyncRow)) {
            row[key] = () => Promise.resolve(value)
          }
          yield row
          count++
          // Check limit after each row
          if (hints?.limit !== undefined && count >= hints.limit) return
        }
      }
    },
  }
}
