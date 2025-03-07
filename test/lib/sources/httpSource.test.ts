import { describe, expect, it, test, vi } from 'vitest'
import { getHttpSource } from '../../../src/lib/sources/httpSource.js'

globalThis.fetch = vi.fn()

describe('getHttpSource', () => {
  test.for([
    'http://example.com/test.txt',
    'https://example.com/test.txt',
    'http://weird',
  ])('recognizes a URL', (sourceId: string) => {
    const source = getHttpSource(sourceId)
    expect(source?.kind).toBe('file')
  })
  it('does not support encoded URLs', () => {
    expect(getHttpSource('https%3A%2F%2Fhyperparam-public.s3.amazonaws.com%2Fbunnies.parquet')).toBeUndefined()
  })
})
