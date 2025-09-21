import { tools } from './tools.js'

/** @type {'text' | 'tool'} */
let outputMode = 'text' // default output mode

const instructions =
  'You are a machine learning web application named "Hyperparam" running on a CLI terminal.'
  + '\nYou assist users with analyzing and exploring datasets, particularly in parquet format.'
  + ' The website and api are available at hyperparam.app.'
  + ' The Hyperparam CLI tool can list and explore local parquet files.'
  + '\nYou are on a terminal and can only output: text, emojis, terminal colors, and terminal formatting.'
  + ' Don\'t add additional markdown or html formatting unless requested.'
  + (process.stdout.isTTY ? ` The terminal width is ${process.stdout.columns} characters.` : '')

const colors = {
  system: '\x1b[36m', // cyan
  user: '\x1b[33m', // yellow
  tool: '\x1b[90m', // gray
  error: '\x1b[31m', // red
  normal: '\x1b[0m', // reset
}

/**
 * @import { ResponsesInput, ResponseInputItem } from './types.d.ts'
 * @param {ResponsesInput} chatInput
 * @returns {Promise<ResponseInputItem[]>}
 */
async function sendToServer(chatInput) {
  // Send the request to the server
  const response = await fetch('https://hyperparam.app/api/functions/openai/responses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(chatInput),
  })

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`)
  }

  // Process the streaming response
  /** @type {ResponseInputItem[]} */
  const incoming = []
  const reader = response.body?.getReader()
  if (!reader) throw new Error('No response body')
  const decoder = new TextDecoder()
  let buffer = ''
  const write = writeWithColor()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    // Keep the last line in the buffer
    buffer = lines.pop() || ''
    for (const line of lines) {
      if (!line.trim()) continue
      try {
        const chunk = JSON.parse(line)
        const { type, error } = chunk
        if (type === 'response.output_text.delta') {
          // text mode
          if (outputMode === 'tool') {
            write('\n')
          }
          outputMode = 'text'

          // Append to incoming message
          const last = incoming[incoming.length - 1]
          if (last && 'role' in last && last.role === 'assistant' && last.id === chunk.item_id) {
            // Append to existing assistant message
            last.content += chunk.delta
          } else {
            // Create a new incoming message
            incoming.push({ role: 'assistant', content: chunk.delta, id: chunk.item_id })
          }

          write(chunk.delta)
        } else if (error) {
          console.error(error)
          throw new Error(error)
        } else if (type === 'function_call') {
          incoming.push(chunk)
        } else if (type === 'response.output_item.done' && chunk.item.type === 'reasoning') {
          /** @type {import('./types.d.ts').ReasoningItem} */
          const reasoningItem = {
            type: 'reasoning',
            id: chunk.item.id,
            summary: chunk.item.summary,
          }
          incoming.push(reasoningItem)
        } else if (!chunk.key) {
          console.log('Unknown chunk', chunk)
        }
      } catch (err) {
        console.error('Error parsing chunk', err)
      }
    }
  }
  return incoming
}

/**
 * Send messages to the server and handle tool calls.
 * Will mutate the messages array!
 *
 * @import { ResponseFunctionToolCall, ToolHandler } from './types.d.ts'
 * @param {ResponseInputItem[]} input
 * @returns {Promise<void>}
 */
async function sendMessages(input) {
  /** @type {ResponsesInput} */
  const chatInput = {
    model: 'gpt-5',
    instructions,
    input,
    reasoning: {
      effort: 'low',
    },
    tools: tools.map(tool => tool.tool),
  }
  const incoming = await sendToServer(chatInput)

  // handle tool calls
  /** @type {{ toolCall: ResponseFunctionToolCall, tool: ToolHandler, result: Promise<string> }[]} */
  const toolResults = []

  // start handling tool calls
  for (const message of incoming) {
    if (message.type === 'function_call') {
      const tool = tools.find(tool => tool.tool.name === message.name)
      if (tool) {
        const args = JSON.parse(message.arguments ?? '{}')
        const result = tool.handleToolCall(args)
        toolResults.push({ toolCall: message, tool, result })
      } else {
        throw new Error(`Unknown tool: ${message.name}`)
      }
    }
  }

  // tool mode
  if (toolResults.length > 0) {
    if (outputMode === 'text') {
      write('\n')
    }
    outputMode = 'tool' // switch to tool output mode

    // Wait for pending tool calls and process results
    for (const toolResult of toolResults) {
      const { toolCall, tool } = toolResult
      const { call_id } = toolCall
      try {
        const output = await toolResult.result

        // Construct function call message
        const args = JSON.parse(toolCall.arguments)
        const entries = Object.entries(args)
        let func = toolCall.name
        if (entries.length === 0) {
          func += '()'
        } else {
          // transform to (arg1 = 111, arg2 = 222)
          const pairs = entries.map(([key, value]) => `${key} = ${value}`)
          func += `(${pairs.join(', ')})`
        }
        write(colors.tool, `${tool.emoji} ${func}`, colors.normal, '\n')
        incoming.push({ type: 'function_call_output', output, call_id })
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        const toolName = toolCall.name ?? toolCall.id
        write(colors.error, `\nError calling tool ${toolName}: ${message}`, colors.normal)
        incoming.push({ type: 'function_call_output', output: `Error calling tool ${toolName}: ${message}`, call_id })
      }
    }

    input.push(...incoming)

    // send messages with tool results
    await sendMessages(input)
  } else {
    // no tool calls, just append incoming messages
    input.push(...incoming)
  }
}

/**
 * @param {string[]} args
 */
function write(...args) {
  args.forEach(s => process.stdout.write(s))
}

/**
 * Handle streaming output, but buffer if needed to handle escape codes.
 * @returns {(...args: string[]) => void}
 */
function writeWithColor() {
  /** @type {string | undefined} */
  let buffer
  /**
   * @param {string} char
   */
  function writeChar(char) {
    if (buffer === undefined && char !== '\\' && char !== '\x1b') {
      write(char)
    } else {
      buffer ??= ''
      buffer += char
      const isEscape = buffer.startsWith('\\x1b[') || buffer.startsWith('\\033[')
      // if the buffer is an escape sequence, write it
      if (isEscape) {
        // convert to terminal escape sequence
        const escaped = buffer.replace(/\\x1b\[/g, '\x1b[').replace(/\\033\[/g, '\x1b[')
        write(escaped)
        buffer = undefined
      } else if (buffer.length > 6) {
        // no match, just write it
        write(buffer)
        buffer = undefined
      }
    }
  }
  return (...args) => {
    for (const arg of args) {
      for (const char of arg) {
        writeChar(char)
      }
    }
  }
}

export function chat() {
  /** @type {ResponseInputItem[]} */
  const messages = []
  process.stdin.setEncoding('utf-8')

  write(colors.system, 'question: ', colors.normal)

  process.stdin.on('data', async (/** @type {string} */ input) => {
    input = input.trim()
    if (input === 'exit') {
      process.exit()
    } else if (input) {
      try {
        write(colors.user, 'answer: ', colors.normal)
        outputMode = 'text' // switch to text output mode
        messages.push({ role: 'user', content: input.trim() })
        await sendMessages(messages)
      } catch (error) {
        console.error(colors.error, '\n' + error)
      } finally {
        write('\n\n')
      }
    }
    write(colors.system, 'question: ', colors.normal)
  })
}
