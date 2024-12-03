import { assert, describe, expect, it, test, vi } from 'vitest'
import { HttpFileSystem, HyperparamFileMetadata, HyperparamFileSystem } from '../../src/lib/filesystem.js'

global.fetch = vi.fn()

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

describe('HyperparamFileSystem.listFiles', () => {
  it('creates a full source by concatenating the file with the prefix', async () => {
    const mockFiles: HyperparamFileMetadata[] = [
      { key: 'folder1/', lastModified: '2023-01-01T00:00:00Z' },
      { key: 'file1.txt', fileSize: 8196, lastModified: '2023-01-01T00:00:00Z' },
    ]
    vi.mocked(fetch).mockResolvedValueOnce({
      json: () => Promise.resolve(mockFiles),
      ok: true,
    } as Response)

    const endpoint = 'http://localhost:3000'
    const source = new HyperparamFileSystem({ endpoint }).getSource('folder0/')
    assert(source?.kind === 'directory')
    const files = await source.listFiles()

    expect(files).to.be.an('array').and.have.length(2)
    expect(files[0].source).toBe('folder0/folder1/')
    expect(files[1].source).toBe('folder0/file1.txt')
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
