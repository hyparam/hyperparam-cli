import { expect, test } from 'vitest'
import { parseHuggingFaceUrl } from '../../../src/lib/sources/huggingFaceSource.js'

const origin = 'https://huggingface.co'

test.for([[''], ['abc']])('non-url string \'%s\' throws an error', ([url]) => {
  expect(() => parseHuggingFaceUrl(url)).to.throw()
})

test.for([['ftp:'], ['email:']])('\'%s\' scheme throws an error', ([scheme]) => {
  expect(() => parseHuggingFaceUrl(`${scheme}//abc`)).to.throw()
})

test.for([['https://some.url'], ['https://some.url/with/a/path']])(
  'non-huggingface URL throws: %s',
  ([url]) => {
    expect(() => parseHuggingFaceUrl(url)).to.throw()
  }
)

test.for([
  ['https://huggingface.co'],
  ['https://hf.co'],
  ['https://huggingface.co/'],
  ['https://huggingface.co/datasets'],
  ['https://huggingface.co/datasets/'],
  ['https://huggingface.co/datasets/namespace'],
  ['https://huggingface.co/datasets/namespace/'],
])('base huggingface URL throws: %s', ([url]) => {
  expect(() => parseHuggingFaceUrl(url)).to.throw()
})

test.for([
  ['https://huggingface.co/namespace/model'],
  ['https://huggingface.co/namespace/model/'],
  ['https://huggingface.co/spaces/namespace/space'],
  ['https://huggingface.co/spaces/namespace/space/'],
])('model or space huggingface URL throws: %s', ([url]) => {
  expect(() => parseHuggingFaceUrl(url)).to.throw()
})

test.for([
  ['https://huggingface.co/datasets/namespace/repo', 'namespace/repo'],
  ['https://huggingface.co/datasets/namespace/repo/', 'namespace/repo'],
  ['https://huggingface.co/datasets/namespace/123', 'namespace/123'],
])('dataset repo URL returns a RepoUrl: %s', ([url, repo]) => {
  expect(parseHuggingFaceUrl(url)).toEqual({
    kind: 'directory',
    origin,
    repo,
    source: url,
    action: 'tree',
    branch: 'main',
    path: '',
  })
})

test.for([
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

test.for([
  ['https://huggingface.co/not-supported'],
  ['https://huggingface.co/not/supported'],
  ['https://huggingface.co/tasks'],
  ['https://huggingface.co/models'],
  ['https://huggingface.co/spaces'],
  ['https://huggingface.co/datasets/namespace/repo/branch'],
  ['https://huggingface.co/datasets/namespace/repo/tree'],
  ['https://huggingface.co/datasets/namespace/repo/tree/'],
  ['https://huggingface.co/datasets/namespace/repo/blob'],
  ['https://huggingface.co/datasets/namespace/repo/blob/'],
  ['https://huggingface.co/datasets/namespace/repo/blob/branch'],
  ['https://huggingface.co/datasets/namespace/repo/blob/branch/'],
  ['https://huggingface.co/datasets/namespace/repo/blob/branch/file/'],
  ['https://huggingface.co/datasets/namespace/repo/resolve'],
  ['https://huggingface.co/datasets/namespace/repo/resolve/'],
  ['https://huggingface.co/datasets/namespace/repo/resolve/branch'],
  ['https://huggingface.co/datasets/namespace/repo/resolve/branch/'],
  ['https://huggingface.co/datasets/namespace/repo/resolve/branch/file/'],
])('unrelated huggingface URL throws and error: %s', ([url]) => {
  expect(() => parseHuggingFaceUrl(url)).to.throw()
})
