import { tools } from './tools.js'

/** @type {'text' | 'tool'} */
let outputMode = 'text' // default output mode

function systemPrompt() {
  return 'You are a machine learning web application named "Hyperparam" running on a CLI terminal.'
  + '\nYou assist users with analyzing and exploring datasets, particularly in parquet format.'
  + ' The website and api are available at hyperparam.app.'
  + ' The Hyperparam CLI tool can list and explore local parquet files.'
  + '\nYou are on a terminal and can only output: text, emojis, terminal colors, and terminal formatting.'
  + ' Don\'t add additional markdown or html formatting unless requested.'
  + (process.stdout.isTTY ? ` The terminal width is ${process.stdout.columns} characters.` : '')
}
/** @type {Message} */
const systemMessage = { role: 'system', content: systemPrompt() }

const colors = {
  system: '\x1b[36m', // cyan
  user: '\x1b[33m', // yellow
  tool: '\x1b[90m', // gray
  error: '\x1b[31m', // red
  normal: '\x1b[0m', // reset
}

/**
 * @import { Message } from './types.d.ts'
 * @param {Object} chatInput
 * @returns {Promise<Message>}
 */
async function sendToServer(chatInput) {
  const response = await fetch('https://hyperparam.app/api/functions/openai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(chatInput),
  })

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`)
  }

  // Process the streaming response
  /** @type {Message} */
  const streamResponse = { role: 'assistant', content: '' }
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
          streamResponse.content += chunk.delta
          write(chunk.delta)
        } else if (error) {
          console.error(error)
          throw new Error(error)
        } else if (chunk.function) {
          streamResponse.tool_calls ??= []
          streamResponse.tool_calls.push(chunk)
        } else if (!chunk.key) {
          console.log('Unknown chunk', chunk)
        }
      } catch (err) {
        console.error('Error parsing chunk', err)
      }
    }
  }
  return streamResponse
}

/**
 * Send messages to the server and handle tool calls.
 * Will mutate the messages array!
 *
 * @import { ToolCall, ToolHandler } from './types.d.ts'
 * @param {Message[]} messages
 * @returns {Promise<void>}
 */
async function sendMessages(messages) {
  const chatInput = {
    model: 'gpt-4o',
    messages,
    tools: tools.map(tool => tool.tool),
  }
  const response = await sendToServer(chatInput)
  messages.push(response)
  // handle tool results
  if (response.tool_calls?.length) {
    /** @type {{ toolCall: ToolCall, tool: ToolHandler, result: Promise<string> }[]} */
    const toolResults = []
    for (const toolCall of response.tool_calls) {
      const tool = tools.find(tool => tool.tool.function.name === toolCall.function.name)
      if (tool) {
        const args = JSON.parse(toolCall.function?.arguments ?? '{}')
        const result = tool.handleToolCall(args)
        toolResults.push({ toolCall, tool, result })
      } else {
        throw new Error(`Unknown tool: ${toolCall.function.name}`)
      }
    }
    // tool mode
    if (outputMode === 'text') {
      write('\n')
    }
    outputMode = 'tool' // switch to tool output mode
    for (const toolResult of toolResults) {
      const { toolCall, tool } = toolResult
      try {
        const content = await toolResult.result

        // Construct function call message
        const args = JSON.parse(toolCall.function?.arguments ?? '{}')
        const entries = Object.entries(args)
        let func = toolCall.function.name
        if (entries.length === 0) {
          func += '()'
        } else {
          // transform to (arg1 = 111, arg2 = 222)
          const pairs = entries.map(([key, value]) => `${key} = ${value}`)
          func += `(${pairs.join(', ')})`
        }
        write(colors.tool, `${tool.emoji} ${func}`, colors.normal, '\n')
        messages.push({ role: 'tool', content, tool_call_id: toolCall.id })
      } catch (error) {
        write(colors.error, `\nError calling tool ${toolCall.function.name}: ${error.message}`, colors.normal)
        messages.push({ role: 'tool', content: `Error calling tool ${toolCall.function.name}: ${error.message}`, tool_call_id: toolCall.id })
      }
    }

    // send messages with tool results
    await sendMessages(messages)
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
  /** @type {Message[]} */
  const messages = [systemMessage]
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
