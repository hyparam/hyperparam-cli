import { describe, expect, test } from 'vitest'
import { parseHuggingFaceUrl } from '../../../src/lib/sources/huggingFaceSource.js'

const origin = 'https://huggingface.co'

describe('parseHuggingFaceUrl', () => {
  test.for([
    'huggingface.co',
    'huggingface.com',
    'hf.co',
  ])('accepts domain: %s', (domain) => {
    const origin = `https://${domain}`
    const url = `${origin}/datasets/namespace/repo`
    expect(parseHuggingFaceUrl(url)).toEqual({
      kind: 'directory',
      origin,
      repo: 'namespace/repo',
      source: url,
      action: 'tree',
      branch: 'main',
      path: '',
    })
  })
  test.for([
    'ftp://huggingface.co',
    'email://huggingface.co',
    'http://huggingface.co',
    'https://hf.com',
    'https://github.com',
    'huggingface.co',
  ])('throws for unsupported scheme or domain: \'%s\'', (host) => {
    expect(() => parseHuggingFaceUrl(`${host}/datasets/namespace/repo`)).to.throw()
  })

  test.for([
    '',
    '/',
    '/anything',
    '/tasks',
    '/models',
    '/namespace/model', // TODO(SL): support model
    '/settings/profile', // TODO(SL): add a block/allow list?
    '/datasets',
    '/datasets/',
    '/datasets/namespace',
    '/datasets/namespace/',
    '/spaces',
    '/spaces/namespace',
    '/spaces/namespace/space', // TODO(SL): support space
    '/datasets/namespace/repo/branch',
    '/datasets/namespace/repo/tree',
    '/datasets/namespace/repo/tree/',
    '/datasets/namespace/repo/blob',
    '/datasets/namespace/repo/blob/',
    '/datasets/namespace/repo/blob/branch',
    '/datasets/namespace/repo/blob/branch/',
    '/datasets/namespace/repo/blob/branch/file/',
    '/datasets/namespace/repo/resolve',
    '/datasets/namespace/repo/resolve/',
    '/datasets/namespace/repo/resolve/branch',
    '/datasets/namespace/repo/resolve/branch/',
    '/datasets/namespace/repo/resolve/branch/file/',
  ])('throws for invalid path: %s', (path) => {
    expect(() => parseHuggingFaceUrl(`https://huggingface.co${path}`)).to.throw()
  })

  test.for([
    [
      'https://huggingface.co/datasets/namespace/repo',
      'https://huggingface.co/datasets/namespace/repo',
      'namespace/repo',
      'main',
      '',
    ],
    [
      'https://huggingface.co/datasets/namespace/repo/',
      'https://huggingface.co/datasets/namespace/repo/',
      'namespace/repo',
      'main',
      '',
    ],
    [
      'https://huggingface.co/datasets/namespace/123',
      'https://huggingface.co/datasets/namespace/123',
      // all-number identifier is not a valid HF repo name, but we accept any string
      'namespace/123',
      'main',
      ''],
    [
      'https://huggingface.co/datasets/namespace/repo/tree/branch',
      'https://huggingface.co/datasets/namespace/repo/tree/branch',
      'namespace/repo',
      'branch',
      '',
    ],
    [
      'https://huggingface.co/datasets/namespace/repo/tree/branch/',
      'https://huggingface.co/datasets/namespace/repo/tree/branch',
      'namespace/repo',
      'branch',
      '',
    ],
    [
      'https://huggingface.co/datasets/namespace/repo/tree/refs%2Fconvert%2Fparquet',
      'https://huggingface.co/datasets/namespace/repo/tree/refs%2Fconvert%2Fparquet',
      'namespace/repo',
      'refs%2Fconvert%2Fparquet',
      '',
    ],
    [
      'https://huggingface.co/datasets/namespace/repo/tree/refs/convert/parquet',
      // also accepted because of URLSearchParams (see note in https://url.spec.whatwg.org/#dom-urlsearchparams-urlsearchparams)
      'https://huggingface.co/datasets/namespace/repo/tree/refs%2Fconvert%2Fparquet',
      'namespace/repo',
      'refs%2Fconvert%2Fparquet',
      '',
    ],
    [
      'https://huggingface.co/datasets/namespace/repo/tree/refs/pr/9',
      'https://huggingface.co/datasets/namespace/repo/tree/refs%2Fpr%2F9',
      'namespace/repo',
      'refs%2Fpr%2F9',
      '',
    ],
    [
      'https://huggingface.co/datasets/namespace/repo/tree/branch/folder',
      'https://huggingface.co/datasets/namespace/repo/tree/branch/folder',
      'namespace/repo',
      'branch',
      '/folder',
    ],
    [
      'https://huggingface.co/datasets/namespace/repo/tree/branch/a/b/c/',
      'https://huggingface.co/datasets/namespace/repo/tree/branch/a/b/c',
      'namespace/repo',
      'branch',
      '/a/b/c',
    ],
    [
      'https://huggingface.co/datasets/namespace/repo/tree/branch/folder.parquet',
      'https://huggingface.co/datasets/namespace/repo/tree/branch/folder.parquet',
      'namespace/repo',
      'branch',
      '/folder.parquet',
    ],
  ])(
    'tree repo URL with a branch and an optional path returns a FolderUrl: %s',
    ([url, source, repo, branch, path]) => {
      expect(parseHuggingFaceUrl(url)).toEqual({
        kind: 'directory',
        origin,
        repo,
        source,
        action: 'tree',
        branch,
        path,
      })
    }
  )

  test.for([
    [
      'https://huggingface.co/datasets/namespace/repo/blob/branch/file',
      'https://huggingface.co/datasets/namespace/repo/blob/branch/file',
      'namespace/repo',
      'branch',
      '/file',
      'https://huggingface.co/datasets/namespace/repo/resolve/branch/file',
    ],
    [
      'https://huggingface.co/datasets/namespace/repo/blob/branch/path/to/file',
      'https://huggingface.co/datasets/namespace/repo/blob/branch/path/to/file',
      'namespace/repo',
      'branch',
      '/path/to/file',
      'https://huggingface.co/datasets/namespace/repo/resolve/branch/path/to/file',
    ],
    [
      'https://huggingface.co/datasets/namespace/repo/blob/refs%2Fconvert%2Fparquet/file',
      'https://huggingface.co/datasets/namespace/repo/blob/refs%2Fconvert%2Fparquet/file',
      'namespace/repo',
      'refs%2Fconvert%2Fparquet',
      '/file',
      'https://huggingface.co/datasets/namespace/repo/resolve/refs%2Fconvert%2Fparquet/file',
    ],
    [
      'https://huggingface.co/datasets/namespace/repo/blob/refs/convert/parquet/file',
      'https://huggingface.co/datasets/namespace/repo/blob/refs%2Fconvert%2Fparquet/file',
      'namespace/repo',
      'refs%2Fconvert%2Fparquet',
      '/file',
      'https://huggingface.co/datasets/namespace/repo/resolve/refs%2Fconvert%2Fparquet/file',
    ],
    [
      'https://huggingface.co/datasets/namespace/repo/blob/branch/file.parquet',
      'https://huggingface.co/datasets/namespace/repo/blob/branch/file.parquet',
      'namespace/repo',
      'branch',
      '/file.parquet',
      'https://huggingface.co/datasets/namespace/repo/resolve/branch/file.parquet',
    ],
  ])(
    'blob repo URL with a branch and a path returns a FileUrl: %s',
    ([url, source, repo, branch, path, resolveUrl]) => {
      expect(parseHuggingFaceUrl(url)).toEqual({
        kind: 'file',
        origin,
        repo,
        source,
        action: 'blob',
        branch,
        path,
        resolveUrl,
      })
    }
  )

  test.for([
    [
      'https://huggingface.co/datasets/namespace/repo/resolve/branch/file',
      'https://huggingface.co/datasets/namespace/repo/resolve/branch/file',
      'namespace/repo',
      'branch',
      '/file',
      'https://huggingface.co/datasets/namespace/repo/resolve/branch/file',
    ],
    [
      'https://huggingface.co/datasets/namespace/repo/resolve/branch/file?download=true',
      'https://huggingface.co/datasets/namespace/repo/resolve/branch/file',
      'namespace/repo',
      'branch',
      '/file',
      'https://huggingface.co/datasets/namespace/repo/resolve/branch/file',
    ],
    [
      'https://huggingface.co/datasets/namespace/repo/resolve/branch/path/to/file',
      'https://huggingface.co/datasets/namespace/repo/resolve/branch/path/to/file',
      'namespace/repo',
      'branch',
      '/path/to/file',
      'https://huggingface.co/datasets/namespace/repo/resolve/branch/path/to/file',
    ],
    [
      'https://huggingface.co/datasets/namespace/repo/resolve/refs%2Fconvert%2Fparquet/file',
      'https://huggingface.co/datasets/namespace/repo/resolve/refs%2Fconvert%2Fparquet/file',
      'namespace/repo',
      'refs%2Fconvert%2Fparquet',
      '/file',
      'https://huggingface.co/datasets/namespace/repo/resolve/refs%2Fconvert%2Fparquet/file',
    ],
    [
      'https://huggingface.co/datasets/namespace/repo/resolve/branch/file.parquet',
      'https://huggingface.co/datasets/namespace/repo/resolve/branch/file.parquet',
      'namespace/repo',
      'branch',
      '/file.parquet',
      'https://huggingface.co/datasets/namespace/repo/resolve/branch/file.parquet',
    ],
  ])(
    'resolve repo URL with a branch and a path returns a FileUrl: %s',
    ([url, source, repo, branch, path, resolveUrl]) => {
      expect(parseHuggingFaceUrl(url)).toEqual({
        kind: 'file',
        origin,
        repo,
        source,
        action: 'resolve',
        branch,
        path,
        resolveUrl,
      })
    }
  )
})
