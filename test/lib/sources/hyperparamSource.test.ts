import { assert, describe, expect, it, test, vi } from 'vitest'
import { HyperparamFileMetadata, getHyperparamSource } from '../../../src/lib/sources/hyperparamSource.js'

globalThis.fetch = vi.fn()

describe('getHyperparamSource', () => {
  const endpoint = 'http://localhost:3000'

  test.for([
    'test.txt',
    'no-extension',
    'folder/subfolder/test.txt',
  ])('recognizes a local file path', (sourceId: string) => {
    expect(getHyperparamSource(sourceId, { endpoint })?.kind).toBe('file')
  })

  test.for([
    '',
    'folder1/',
    'folder1/folder2/',
  ])('recognizes a folder', (sourceId: string) => {
    expect(getHyperparamSource(sourceId, { endpoint })?.kind).toBe('directory')
  })

  test.for([
    '/',
    '////',
  ])('does not support a heading slash', (sourceId: string) => {
    expect(getHyperparamSource(sourceId, { endpoint })).toBeUndefined()
  })

  test.for([
    'test.txt',
    'folder/subfolder/test.txt',
  ])('encodes the parameters in resolveUrl', (sourceId: string) => {
    const source = getHyperparamSource(sourceId, { endpoint })
    assert(source?.kind === 'file')
    expect(source.resolveUrl).toBe(endpoint + '/api/store/get?key=' + encodeURIComponent(sourceId))
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
    const source = getHyperparamSource('folder0/', { endpoint })
    assert(source?.kind === 'directory')
    const files = await source.listFiles()

    expect(files).to.be.an('array').and.have.length(2)
    expect(files[0].sourceId).toBe('folder0/folder1/')
    expect(files[1].sourceId).toBe('folder0/file1.txt')
  })
})
