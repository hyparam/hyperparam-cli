import { AsyncBuffer } from 'hyparquet'

/**
 * Helper function to join class names
 */
export function cn(...names: (string | undefined | false)[]): string {
  return names.filter((n) => n).join(' ')
}

interface AsyncBufferFromUrlOptions {
  url: string;
  byteLength?: number;
  headers?: Record<string, string>;
}

/**
 * Get the byte length of a URL using a HEAD request.
 *
 * @param {string} url
 * @returns {Promise<number>}
 */
export async function byteLengthFromUrl(
  url: globalThis.RequestInfo | URL,
  init?: globalThis.RequestInit,
): Promise<number> {
  return await fetch(url, { ...init, method: 'HEAD' }).then((res) => {
    if (!res.ok) throw new Error(`fetch head failed ${res.status.toString()}`)
    const length = res.headers.get('Content-Length')
    if (!length) throw new Error('missing content length')
    return parseInt(length)
  })
}

export async function asyncBufferFromUrl({
  url,
  byteLength,
  headers,
}: AsyncBufferFromUrlOptions): Promise<AsyncBuffer> {
  // byte length from HEAD request
  byteLength ||= await byteLengthFromUrl(url, { headers })
  return {
    byteLength,
    async slice(start, end) {
      // fetch byte range from url
      const endStr = end === undefined ? '' : end - 1
      const res = await fetch(url, {
        headers: {
          ...headers,
          range: `bytes=${start.toString()}-${endStr.toString()}`,
        },
      })
      if (!res.ok || !res.body)
        throw new Error(`fetch failed ${res.status.toString()}`)
      return res.arrayBuffer()
    },
  }
}
