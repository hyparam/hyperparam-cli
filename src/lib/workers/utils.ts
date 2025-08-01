import { AsyncBuffer, asyncBufferFromUrl, cachedAsyncBuffer } from 'hyparquet'
import { AsyncBufferFrom } from './types.js'

export function fromToAsyncBuffer(from: AsyncBufferFrom, cache?: Map<string, Promise<AsyncBuffer>>): Promise<AsyncBuffer> {
  if ('url' in from) {
    // Cached asyncBuffer for urls only
    const key = JSON.stringify(from)
    if (cache) {
      const cached = cache.get(key)
      if (cached) return cached
    }
    const asyncBuffer = asyncBufferFromUrl(from).then(cachedAsyncBuffer)
    if (cache) {
      cache.set(key, asyncBuffer)
    }
    return asyncBuffer
  } else {
    return from.file.arrayBuffer()
  }
}
