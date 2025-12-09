import fs from 'fs/promises'

const fileLimit = 20 // limit to 20 files per page

/**
 * @import { ToolHandler } from '../types.d.ts'
 * @type {ToolHandler}
 */
export const listFiles = {
  emoji: '📂',
  tool: {
    type: 'function',
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
  /**
   * @param {Record<string, unknown>} args
   * @returns {Promise<string>}
   */
  async handleToolCall({ path, filetype, offset = 0 }) {
    if (typeof path !== 'string') {
      throw new Error('Expected path to be a string')
    }
    if (path.includes('..') || path.includes('~') || path.startsWith('/')) {
      throw new Error('Invalid path: ' + path)
    }
    if (typeof filetype !== 'undefined' && typeof filetype !== 'string') {
      throw new Error('Expected filetype to be a string or undefined')
    }
    const start = validateInteger('offset', offset, 0)
    // list files in the directory
    const filenames = (await fs.readdir(path || '.'))
      .filter(key => !filetype || key.endsWith(`.${filetype}`)) // filter by file type if provided
    const limited = filenames.slice(start, start + fileLimit)
    const end = start + limited.length
    return `Files ${start + 1}..${end} of ${filenames.length}:\n${limited.join('\n')}`
  },
}

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
