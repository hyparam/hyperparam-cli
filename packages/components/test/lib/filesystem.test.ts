import { assert, describe, expect, it, test } from 'vitest'
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

describe('HyperparamFileSystem.getResolveUrl', () => {
  test.for([
    'test.txt',
    'folder/subfolder/test.txt',
  ])('encodes the parameters', (key: string) => {
    const endpoint = 'http://localhost:3000'
    const source = new HyperparamFileSystem({ endpoint }).getSource(key)
    assert(source?.kind === 'file')
    expect(source.resolveUrl).toBe(endpoint + '/api/store/get?key=' + encodeURIComponent(key))
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
