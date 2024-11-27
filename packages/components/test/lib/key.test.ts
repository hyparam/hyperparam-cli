import { describe, expect, test } from 'vitest'
import { parseKey } from '../../src/lib/key.js'

describe('parseKey', () => {
  test.for([
    'test.txt',
    'no-extension',
    'folder/subfolder/test.txt',
  ])('recognizes a local file path', (key: string) => {
    const parsedKey = parseKey(key, { apiBaseUrl: 'http://localhost:3000' })
    expect(parsedKey.kind).toBe('file')
  })

  test.for([
    '',
    '/',
    '////',
    'folder1/',
    'folder1/folder2/',
  ])('recognizes a folder', (key: string) => {
    const parsedKey = parseKey(key, { apiBaseUrl: 'http://localhost:3000' })
    expect(parsedKey.kind).toBe('folder')
  })

  test.for([
    'http://example.com/test.txt',
    'https://example.com/test.txt',
    'http://weird',
    'https%3A%2F%2Fhyperparam-public.s3.amazonaws.com%2Fbunnies.parquet',
  ])('recognizes a URL', (key: string) => {
    const parsedKey = parseKey(key, { apiBaseUrl: 'http://localhost:3000' })
    expect(parsedKey.kind).toBe('url')
  })
})
