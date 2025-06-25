export interface ToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments?: string
  }
}

export type Role = 'system' | 'user' | 'assistant' | 'tool'

export interface Message {
  role: Role
  content: string
  tool_calls?: ToolCall[]
  tool_call_id?: string
  error?: string
}

export interface ToolHandler {
  emoji: string
  tool: Tool
  handleToolCall(args: Record<string, unknown>): Promise<string>
}
interface ToolProperty {
  type: string
  description: string
}

export interface Tool {
  type: 'function'
  function: {
    name: string
    description: string
    parameters?: {
      type: 'object'
      properties: Record<string, ToolProperty>
      required?: string[]
      additionalProperties?: boolean
    },
    strict?: boolean
  }
}
