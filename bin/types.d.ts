// Model Input
// Based on ResponseCreateParamsStreaming from openai client
export interface ResponsesInput {
  model: string
  input: ResponseInputItem[] // or string but we always use stateless messages
  instructions?: string // system prompt
  background?: boolean
  include?: string[]
  reasoning?: {
    effort?: 'low' | 'medium' | 'high'
    summary?: 'auto' | 'concise' | 'detailed'
  }
  tools?: ResponseTool[]
  max_output_tokens?: number
  parallel_tool_calls?: boolean
  previous_response_id?: string
  // service_tier?: 'auto' | 'default' | 'flex'
  // store?: boolean // store response for later retrieval
  temperature?: number // 0..2
  text?: unknown
  tool_choice?: 'auto' | 'none' | 'required'
  top_p?: number // 0..1
  truncation?: 'auto' | 'disabled'
  user?: string
}

export type ResponseInputItem =
  | EasyInputMessage
  | ResponseFunctionToolCall
  | FunctionCallOutput
  | ReasoningItem
  | WebSearchItem

// Input message types
interface EasyInputMessage {
  type?: 'message'
  content: string
  role: 'user' | 'assistant' | 'system' | 'developer'
  id?: string // msg_123
}
interface ResponseFunctionToolCall {
  type: 'function_call'
  arguments: string
  call_id: string
  name: string
  id?: string
}

export interface FunctionCallOutput {
  type: 'function_call_output'
  call_id: string // call_123
  output: string
}

export interface ReasoningItem {
  type: 'reasoning'
  summary: {
    type: 'summary_text'
    text: string
  }[]
  id: string
}

export interface WebSearchItem {
  type: 'web_search_call'
  id: string // ws_123
  status: 'in_progress' | 'completed' | 'failed'
  action?: {
    type: 'search'
  }
}

// Tool Handlers
export interface ToolHandler {
  emoji: string
  tool: ResponseFunction // TODO: change to ResponseTool if web search is needed
  handleToolCall(args: Record<string, unknown>): Promise<string>
}
// Tool Description
type ResponseTool =
  | ResponseFunction
  | WebSearchTool

interface ResponseFunction {
  type: 'function'
  name: string
  description: string
  parameters?: ToolParameters
  strict?: boolean
}

export interface WebSearchTool {
  type: 'web_search'
  search_context_size?: 'low' | 'medium' | 'high'
  user_location?: object
}

// Types of tool parameters
export interface ToolParameters {
  type: 'object'
  properties: Record<string, ToolProperty>
  required?: string[]
  additionalProperties?: boolean
}
interface BaseToolProperty {
  description?: string
}
interface StringToolProperty extends BaseToolProperty {
  type: 'string'
  enum?: string[]
}
interface NumberToolProperty extends BaseToolProperty {
  type: 'number'
}
interface BooleanToolProperty extends BaseToolProperty {
  type: 'boolean'
}
interface ArrayToolProperty extends BaseToolProperty {
  type: 'array'
  items: ToolProperty
}
export type ToolProperty = StringToolProperty | NumberToolProperty | ArrayToolProperty | BooleanToolProperty
