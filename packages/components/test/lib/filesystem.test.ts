import { describe, expect, it, test, vi } from 'vitest'
import { HyperparamFileMetadata, createHttpFileSystem, createHyperparamFileSystem } from '../../src/lib/filesystem.js'

global.fetch = vi.fn()

describe('createHyperparamFileSystem', () => {
  const endpoint = 'http://localhost:3000'
  const fs = createHyperparamFileSystem({ endpoint })

  test.for([
    'test.txt',
    'no-extension',
    'folder/subfolder/test.txt',
  ])('recognizes a local file path', (key: string) => {
    expect(fs.canParse(key)).toBe(true)
    expect(fs.getKind(key)).toBe('file')
  })

  test.for([
    '',
    'folder1/',
    'folder1/folder2/',
  ])('recognizes a folder', (key: string) => {
    expect(fs.canParse(key)).toBe(true)
    expect(fs.getKind(key)).toBe('directory')
  })

  test.for([
    '/',
    '////',
  ])('does not support a heading slash', (key: string) => {
    expect(fs.canParse(key)).toBe(false)
  })

  test.for([
    'test.txt',
    'folder/subfolder/test.txt',
  ])('encodes the parameters in resolveUrl', (key: string) => {
    expect(fs.getResolveUrl(key)).toBe(endpoint + '/api/store/get?key=' + encodeURIComponent(key))
  })

  it('in listFiles, creates a full source by concatenating the file with the prefix', async () => {
    const mockFiles: HyperparamFileMetadata[] = [
      { key: 'folder1/', lastModified: '2023-01-01T00:00:00Z' },
      { key: 'file1.txt', fileSize: 8196, lastModified: '2023-01-01T00:00:00Z' },
    ]
    vi.mocked(fetch).mockResolvedValueOnce({
      json: () => Promise.resolve(mockFiles),
      ok: true,
    } as Response)
    const files = await fs.listFiles('folder0')

    expect(files).to.be.an('array').and.have.length(2)
    expect(files[0].source).toBe('folder0/folder1/')
    expect(files[1].source).toBe('folder0/file1.txt')
  })
})

describe('createHttpFileSystem', () => {
  const fs = createHttpFileSystem()

  test.for([
    'http://example.com/test.txt',
    'https://example.com/test.txt',
    'http://weird',
  ])('recognizes a URL', (key: string) => {
    expect(fs.canParse(key)).toBe(true)
    expect(fs.getKind(key)).toBe('file')
  })
  it('does not support encoded URLs', () => {
    expect(fs.canParse('https%3A%2F%2Fhyperparam-public.s3.amazonaws.com%2Fbunnies.parquet')).toBe(false)
  })
})
