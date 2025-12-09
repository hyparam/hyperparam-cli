import { listFiles } from './listFiles.js'
import { parquetSql } from './parquetSql.js'

/**
 * @import { ToolHandler } from '../types.js'
 * @type {ToolHandler[]}
 */
export const tools = [
  listFiles,
  parquetSql,
]
