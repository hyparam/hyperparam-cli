import { asyncBufferFromFile, parquetMetadataAsync } from 'hyparquet'
import { compressors } from 'hyparquet-compressors'
import { collect, executeSql } from 'squirreling'
import { parquetDataSource } from './parquetDataSource.js'
import { markdownTable } from './markdownTable.js'

const maxRows = 100

/**
 * @import { ToolHandler } from '../types.d.ts'
 * @type {ToolHandler}
 */
export const parquetSql = {
  emoji: '🛢️',
  tool: {
    type: 'function',
    name: 'parquet_sql',
    description: 'Execute SQL queries against a parquet file using ANSI SQL syntax.'
      + ' Cell values are truncated by default to 1000 characters (or 10,000 if truncate=false).'
      + ' If a cell is truncated due to length, the column header will say "(truncated)".'
      + ' You can get subsequent pages of long text by using SUBSTR on long columns.'
      + ' Examples:'
      + '\n - `SELECT * FROM table LIMIT 10`'
      + '\n - `SELECT "First Name", "Last Name" FROM table WHERE age > 30 ORDER BY age DESC`.'
      + '\n - `SELECT country, COUNT(*) as total FROM table GROUP BY country`.'
      + '\n - `SELECT SUBSTR(long_column, 10001, 20000) as short_column FROM table`.',
    parameters: {
      type: 'object',
      properties: {
        filename: {
          type: 'string',
          description: 'The name of the parquet file to query.',
        },
        query: {
          type: 'string',
          description: 'The SQL query string. Use standard SQL syntax with WHERE clauses, ORDER BY, LIMIT, GROUP BY, aggregate functions, etc. Wrap column names containing spaces in double quotes: "column name". String literals should be single-quoted. Always use "table" as the table name in your FROM clause.',
        },
        truncate: {
          type: 'boolean',
          description: 'Whether to truncate long string values in the results. If true (default), each string cell is limited to 1000 characters. If false, each string cell is limited to 10,000 characters.',
        },
      },
      required: ['filename', 'query'],
    },
  },
  /**
   * @param {Record<string, unknown>} args
   * @returns {Promise<string>}
   */
  async handleToolCall({ filename, query, truncate = true }) {
    if (typeof filename !== 'string') {
      throw new Error('Expected filename to be a string')
    }
    if (typeof query !== 'string' || query.trim().length === 0) {
      throw new Error('Query parameter must be a non-empty string')
    }

    try {
      const startTime = performance.now()

      // Load parquet file and create data source
      const file = await asyncBufferFromFile(filename)
      const metadata = await parquetMetadataAsync(file)
      const table = parquetDataSource(file, metadata, compressors)

      // Execute SQL query
      const results = await collect(executeSql({ tables: { table }, query }))
      const queryTime = (performance.now() - startTime) / 1000

      // Handle empty results
      if (results.length === 0) {
        return `Query executed successfully but returned no results in ${queryTime.toFixed(1)} seconds.`
      }

      // Format results
      const rowCount = results.length
      const displayRows = results.slice(0, maxRows)

      // Determine max characters per string cell based on truncate parameter
      const maxChars = truncate ? 1000 : 10000

      // Convert to formatted string
      let content = `Query returned ${rowCount} row${rowCount === 1 ? '' : 's'} in ${queryTime.toFixed(1)} seconds.`
      content += '\n\n'
      content += markdownTable(displayRows, maxChars)

      if (rowCount > maxRows) {
        content += `\n\n... and ${rowCount - maxRows} more row${rowCount - maxRows === 1 ? '' : 's'} (showing first ${maxRows} rows)`
      }

      return content
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return `SQL query failed: ${message}`
    }
  },
}
