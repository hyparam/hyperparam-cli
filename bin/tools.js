import fs from 'fs/promises'
import { asyncBufferFromFile, parquetQuery, toJson } from 'hyparquet'
import { compressors } from 'hyparquet-compressors'

const fileLimit = 20 // limit to 20 files per page
/**
 * @import { ToolHandler } from './types.d.ts'
 * @type {ToolHandler[]}
 */
export const tools = [
  {
    emoji: '📂',
    tool: {
      type: 'function',
      function: {
        name: 'list_files',
        description: `List the files in a directory. Files are listed recursively up to ${fileLimit} per page.`,
        parameters: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'The path to list files from. Optional, defaults to the current directory.',
            },
            filetype: {
              type: 'string',
              description: 'Optional file type to filter by, e.g. "parquet", "csv". If not provided, all files are listed.',
            },
            offset: {
              type: 'number',
              description: 'Skip offset number of files in the listing. Defaults to 0. Optional.',
            },
          },
        },
      },
    },
    /**
     * @param {Record<string, unknown>} args
     * @returns {Promise<string>}
     */
    async handleToolCall({ path = '.', filetype, offset = 0 }) {
      if (typeof path !== 'string') {
        throw new Error('Expected path to be a string')
      }
      if (path.includes('..') || path.includes('~')) {
        throw new Error('Invalid path: ' + path)
      }
      if (typeof filetype !== 'undefined' && typeof filetype !== 'string') {
        throw new Error('Expected filetype to be a string or undefined')
      }
      const start = validateInteger('offset', offset, 0)
      // list files in the directory
      const filenames = (await fs.readdir(path))
        .filter(key => !filetype || key.endsWith(`.${filetype}`)) // filter by file type if provided
      const limited = filenames.slice(start, start + fileLimit)
      const end = start + limited.length
      return `Files ${start + 1}..${end} of ${filenames.length}:\n${limited.join('\n')}`
    },
  },
  {
    emoji: '📄',
    tool: {
      type: 'function',
      function: {
        name: 'parquet_get_rows',
        description: 'Get up to 5 rows of data from a parquet file.',
        parameters: {
          type: 'object',
          properties: {
            filename: {
              type: 'string',
              description: 'The name of the parquet file to read.',
            },
            offset: {
              type: 'number',
              description: 'The starting row index to fetch (0-indexed).',
            },
            limit: {
              type: 'number',
              description: 'The number of rows to fetch. Default 5. Maximum 5.',
            },
            orderBy: {
              type: 'string',
              description: 'The column name to sort by.',
            },
          },
          required: ['filename'],
        },
      },
    },
    /**
     * @param {Record<string, unknown>} args
     * @returns {Promise<string>}
     */
    async handleToolCall({ filename, offset = 0, limit = 5, orderBy }) {
      if (typeof filename !== 'string') {
        throw new Error('Expected filename to be a string')
      }
      const rowStart = validateInteger('offset', offset, 0)
      const rowEnd = rowStart + validateInteger('limit', limit, 1, 5)
      if (typeof orderBy !== 'undefined' && typeof orderBy !== 'string') {
        throw new Error('Expected orderBy to be a string')
      }
      const file = await asyncBufferFromFile(filename)
      const rows = await parquetQuery({ file, rowStart, rowEnd, orderBy, compressors })
      let content = ''
      for (let i = rowStart; i < rowEnd; i++) {
        content += `Row ${i}: ${stringify(rows[i])}\n`
      }
      return content
    },
  },
]

/**
 * Validates that a value is an integer within the specified range. Max is inclusive.
 * @param {string} name - The name of the value being validated.
 * @param {unknown} value - The value to validate.
 * @param {number} min - The minimum allowed value (inclusive).
 * @param {number} [max] - The maximum allowed value (inclusive).
 * @returns {number}
 */
function validateInteger(name, value, min, max) {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new Error(`Invalid number for ${name}: ${value}`)
  }
  if (!Number.isInteger(value)) {
    throw new Error(`Invalid number for ${name}: ${value}. Must be an integer.`)
  }
  if (value < min || max !== undefined && value > max) {
    throw new Error(`Invalid number for ${name}: ${value}. Must be between ${min} and ${max}.`)
  }
  return value
}

function stringify(obj, limit = 1000) {
  const str = JSON.stringify(toJson(obj))
  return str.length <= limit ? str : str.slice(0, limit) + '…'
}
