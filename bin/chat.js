import { tools } from './tools.js'

const systemPrompt = 'You are a machine learning web application named "Hyperparam".'
  + ' You assist users with building high quality ML models by introspecting on their training set data.'
  + ' The website and api are available at hyperparam.app.'
  + ' Hyperparam uses LLMs to analyze their own training set.'
  + ' It can generate the perplexity, entropy, and other metrics of the training set.'
  + ' This allows users to find segments of their data set which are difficult to model.'
  + ' This could be because the data is junk, or because the data requires deeper understanding.'
  + ' This is essential for closing the loop on the ML lifecycle.'
  + ' The quickest way to get started is to upload a dataset and start exploring.'
/** @type {Message} */
const systemMessage = { role: 'system', content: systemPrompt }

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
  if (response.tool_calls) {
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
    write('\n')
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

        write(colors.tool, `${tool.emoji} ${func}`, colors.normal, '\n\n')
        messages.push({ role: 'tool', content, tool_call_id: toolCall.id })
      } catch (error) {
        write(colors.error, `\nError calling tool ${toolCall.function.name}: ${error.message}\n\n`, colors.normal)
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
