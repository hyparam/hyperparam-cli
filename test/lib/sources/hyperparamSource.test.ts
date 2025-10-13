import { assert, describe, expect, it, test, vi } from 'vitest'
import { HyperparamFileMetadata, getHyperparamSource } from '../../../src/lib/sources/hyperparamSource.js'

globalThis.fetch = vi.fn()

describe('getHyperparamSource', () => {
  const endpoint = 'http://localhost:3000'

  it('recognizes local files', () => {
    expect(getHyperparamSource('test.txt', { endpoint })?.kind).toBe('file')
    expect(getHyperparamSource('no-extension', { endpoint })?.kind).toBe('file')
    expect(getHyperparamSource('folder/subfolder/test.txt', { endpoint })?.kind).toBe('file')
  })

  it('recognizes folders', () => {
    expect(getHyperparamSource('', { endpoint })?.kind).toBe('directory')
    expect(getHyperparamSource('folder1/', { endpoint })?.kind).toBe('directory')
    expect(getHyperparamSource('folder1/folder2/', { endpoint })?.kind).toBe('directory')
  })

  it('throws on leading slash', () => {
    expect(() => getHyperparamSource('/', { endpoint })).toThrow('Source cannot start with a /')
    expect(() => getHyperparamSource('/folder/', { endpoint })).toThrow('Source cannot start with a /')
  })

  it('throws on .. in path', () => {
    expect(() => getHyperparamSource('..', { endpoint })).toThrow('Source cannot include ..')
    expect(() => getHyperparamSource('folder/../file.txt', { endpoint })).toThrow('Source cannot include ..')
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
