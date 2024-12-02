import { describe, expect, it, test } from 'vitest'
import { HttpFileSystem, HyperparamFileSystem } from '../../src/lib/filesystem.js'

describe('HyperparamFileSystem', () => {
  test.for([
    'test.txt',
    'no-extension',
    'folder/subfolder/test.txt',
  ])('recognizes a local file path', (key: string) => {
    const source = new HyperparamFileSystem({ endpoint: 'http://localhost:3000' }).getSource(key)
    expect(source?.kind).toBe('file')
  })

  test.for([
    '',
    'folder1/',
    'folder1/folder2/',
  ])('recognizes a folder', (key: string) => {
    const source = new HyperparamFileSystem({ endpoint: 'http://localhost:3000' }).getSource(key)
    expect(source?.kind).toBe('directory')
  })

  test.for([
    '/',
    '////',
  ])('does not support a heading slash', (key: string) => {
    const source = new HyperparamFileSystem({ endpoint: 'http://localhost:3000' }).getSource(key)
    expect(source?.kind).toBeUndefined()
  })
})

describe('HttpFileSystem', () => {
  test.for([
    'http://example.com/test.txt',
    'https://example.com/test.txt',
    'http://weird',
  ])('recognizes a URL', (key: string) => {
    const source = new HttpFileSystem().getSource(key)
    expect(source?.kind).toBe('file')
  })
  it('does not support encoded URLs', () => {
    expect(new HttpFileSystem().getSource('https%3A%2F%2Fhyperparam-public.s3.amazonaws.com%2Fbunnies.parquet')).toBeUndefined()
  })
})
