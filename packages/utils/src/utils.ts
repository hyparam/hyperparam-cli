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
    const asyncBuffer = asyncBufferFromUrl(from.url, from.byteLength).then(cachedAsyncBuffer)
    cache.set(key, asyncBuffer)
    return asyncBuffer
  } else {
    return from.file.arrayBuffer()
  }
}
const cache = new Map<string, Promise<AsyncBuffer>>()
// TODO(SL): do we really want a singleton?
