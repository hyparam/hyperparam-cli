import { AsyncBuffer, asyncBufferFromUrl, cachedAsyncBuffer } from 'hyparquet'
import { AsyncBufferFrom } from './workers/types.js'

/**
 * Helper function to join class names
 */
export function cn(...names: (string | undefined | false)[]): string {
  return names.filter((n) => n).join(' ')
}

/**
 * Convert AsyncBufferFromUrl to AsyncBuffer.
 */
export function asyncBufferFrom(from: AsyncBufferFrom): Promise<AsyncBuffer> {
  if ('url' in from) {
    // Cached asyncBuffer for urls only
    const key = JSON.stringify(from)
    const cached = cache.get(key)
    if (cached) return cached
    const asyncBuffer = asyncBufferFromUrl(from).then(cachedAsyncBuffer)
    cache.set(key, asyncBuffer)
    return asyncBuffer
  } else {
    return from.file.arrayBuffer()
  }
}
const cache = new Map<string, Promise<AsyncBuffer>>()
// TODO(SL): do we really want a singleton?

export function getFileDateShort(file?: { lastModified?: string }): string {
  if (!file?.lastModified) return ''
  const date = new Date(file.lastModified)
  // time if within last 24 hours, date otherwise
  const time = date.getTime()
  const now = Date.now()
  if (now - time < 86400000) {
    return date.toLocaleTimeString()
  }
  return date.toLocaleDateString()
}

/**
 * Parse date from lastModified field and format as locale string
 *
 * @param file file-like object with lastModified
 * @param file.lastModified last modified date string
 * @returns formatted date string
 */
export function getFileDate(file?: { lastModified?: string }): string {
  if (!file?.lastModified) return ''
  const date = new Date(file.lastModified)
  return isFinite(date.getTime()) ? date.toLocaleString() : ''
}

/**
 * Returns the file size in human readable format
 *
 * @param bytes file size in bytes
 * @returns formatted file size string
 */
export function formatFileSize(bytes: number): string {
  const sizes = ['b', 'kb', 'mb', 'gb', 'tb']
  if (bytes === 0) return '0 b'
  const i = Math.floor(Math.log2(bytes) / 10)
  if (i === 0) return bytes.toLocaleString('en-US') + ' b'
  const size = sizes[i]
  if (size === undefined) {
    throw new Error(`Size not found at index ${i}`)
  }
  const base = bytes / Math.pow(1024, i)
  return (
    (base < 10 ? base.toFixed(1) : Math.round(base)).toLocaleString('en-US') +
    ' ' +
    size
  )
}

/**
 * Parse the content-length header from a fetch response.
 *
 * @param headers fetch response headers
 * @returns content length in bytes or undefined if not found
 */
export function parseFileSize(headers: Headers): number | undefined {
  const contentLength = headers.get('content-length')
  return contentLength ? Number(contentLength) : undefined
}

export const contentTypes: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  tiff: 'image/tiff',
  webp: 'image/webp',
}

export const imageTypes = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.tiff', '.webp']

/**
 * Robust stringification of any value, including json and bigints.
 */
export function stringify(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'bigint') return value.toLocaleString('en-US')
  if (Array.isArray(value)) {
    return `[\n${value.map((v) => indent(stringify(v), 2)).join(',\n')}\n]`
  }
  if (value === null || value === undefined) return JSON.stringify(value)
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'object') {
    return `{${Object.entries(value)
      .filter((d) => d[1] !== undefined)
      .map(([k, v]) => `${k}: ${stringify(v)}`)
      .join(', ')}}`
  }
  return '{}'
}

function indent(text: string | undefined, spaces: number) {
  return text
    ?.split('\n')
    .map((line) => ' '.repeat(spaces) + line)
    .join('\n')
}
