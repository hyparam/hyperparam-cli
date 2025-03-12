import fs from 'fs/promises'
import { asyncBufferFromFile, parquetQuery, toJson } from 'hyparquet'

/**
 * @import { Message, ToolCall, ToolHandler } from './types.d.ts'
 * @type {ToolHandler[]}
 */
export const tools = [
  {
    emoji: '📂',
    tool: {
      type: 'function',
      function: {
        name: 'list_files',
        description: 'List the files in the current directory.',
        parameters: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'The path to list files from (optional).' },
          },
        },
      },
    },
    /**
     * @param {ToolCall} toolCall
     * @returns {Promise<Message>}
     */
    async handleToolCall(toolCall) {
      let { path = '.' } = JSON.parse(toolCall.function.arguments || '{}')
      if (path.includes('..') || path.includes('~')) {
        throw new Error('Invalid path: ' + path)
      }
      // append to current directory
      path = process.cwd() + '/' + path
      // list files in the current directory
      const filenames = await fs.readdir(path)
      return { role: 'tool', content: `Files:\n${filenames.join('\n')}`, tool_call_id: toolCall.id }
    },
  },
  {
    emoji: '📄',
    tool: {
      type: 'function',
      function: {
        name: 'read_parquet',
        description: 'Read rows from a parquet file. Do not request more than 5 rows.',
        parameters: {
          type: 'object',
          properties: {
            filename: { type: 'string', description: 'The name of the parquet file to read.' },
            rowStart: { type: 'integer', description: 'The start row index.' },
            rowEnd: { type: 'integer', description: 'The end row index.' },
            orderBy: { type: 'string', description: 'The column name to sort by.' },
          },
          required: ['filename'],
        },
      },
    },
    /**
     * @param {ToolCall} toolCall
     * @returns {Promise<Message>}
     */
    async handleToolCall(toolCall) {
      const { filename, rowStart = 0, rowEnd = 5, orderBy } = JSON.parse(toolCall.function.arguments || '{}')
      if (rowEnd - rowStart > 5) {
        throw new Error('Do NOT request more than 5 rows.')
      }
      const file = await asyncBufferFromFile(filename)
      const rows = await parquetQuery({ file, rowStart, rowEnd, orderBy })
      let content = ''
      for (let i = rowStart; i < rowEnd; i++) {
        content += `Row ${i}: ${JSON.stringify(toJson(rows[i]))}\n`
      }
      return { role: 'tool', content, tool_call_id: toolCall.id }
    },
  },
]
