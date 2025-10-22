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
      type: 'dataset',
      source: url,
      action: 'tree',
      branch: 'main',
      path: '',
    })
  })
  it('throws for unsupported scheme or domain', () => {
    expect(() => parseHuggingFaceUrl('ftp://huggingface.co/datasets/namespace/repo')).toThrow()
    expect(() => parseHuggingFaceUrl('email://huggingface.co/datasets/namespace/repo')).toThrow()
    expect(() => parseHuggingFaceUrl('http://huggingface.co/datasets/namespace/repo')).toThrow()
    expect(() => parseHuggingFaceUrl('https://hf.com/datasets/namespace/repo')).toThrow()
    expect(() => parseHuggingFaceUrl('https://github.com/datasets/namespace/repo')).toThrow()
    expect(() => parseHuggingFaceUrl('huggingface.co/datasets/namespace/repo')).toThrow()
  })

  test.for([
    '',
    '/',
    // for the following tests, the same is true:
    // - with a trailing slash
    // - replacing /datasets with /anything, /spaces, /models or /.
    // Avoiding for brevity.
    '/datasets',
    '/datasets/namespace',
    '/datasets/namespace/repo/branch',
    '/datasets/namespace/repo/tree',
    '/datasets/namespace/repo/blob',
    '/datasets/namespace/repo/resolve',
    '/datasets/namespace/repo/blob/branch',
    '/datasets/namespace/repo/resolve/branch',
    // note the trailing slash
    '/datasets/namespace/repo/blob/branch/file/',
    '/datasets/namespace/repo/resolve/branch/file/',
  ])('throws for invalid path: %s', (path) => {
    expect(() => parseHuggingFaceUrl(`https://huggingface.co${path}`)).to.throw()
  })

  test.for([
    { type: 'dataset', typePath: 'datasets/' },
    { type: 'space', typePath: 'spaces/' },
    { type: 'model', typePath: '' },
  ].flatMap(({ type, typePath }) => [
    // Root directory
    [
      `https://huggingface.co/${typePath}namespace/repo`,
      `https://huggingface.co/${typePath}namespace/repo`,
      'namespace/repo',
      type,
      'main',
      '',
    ],
    [
      `https://huggingface.co/${typePath}namespace/repo/`,
      `https://huggingface.co/${typePath}namespace/repo/`,
      'namespace/repo',
      type,
      'main',
      '',
    ],
    // all-number identifier is not a valid HF repo name, but we accept any string
    [
      `https://huggingface.co/${typePath}namespace/123`,
      `https://huggingface.co/${typePath}namespace/123`,
      'namespace/123',
      type,
      'main',
      '',
    ],
    // Branches
    [
      `https://huggingface.co/${typePath}namespace/repo/tree/branch`,
      `https://huggingface.co/${typePath}namespace/repo/tree/branch`,
      'namespace/repo',
      type,
      'branch',
      '',
    ],
    [
      `https://huggingface.co/${typePath}namespace/repo/tree/branch/`,
      `https://huggingface.co/${typePath}namespace/repo/tree/branch`,
      'namespace/repo',
      type,
      'branch',
      '',
    ],
    // special case: both forms 'refs/convert/parquet' and 'refs%2Fconvert%2Fparquet' are accepted
    // see note in https://url.spec.whatwg.org/#dom-urlsearchparams-urlsearchparams
    [
      `https://huggingface.co/${typePath}namespace/repo/tree/refs%2Fconvert%2Fparquet`,
      `https://huggingface.co/${typePath}namespace/repo/tree/refs%2Fconvert%2Fparquet`,
      'namespace/repo',
      type,
      'refs%2Fconvert%2Fparquet',
      '',
    ],
    [
      `https://huggingface.co/${typePath}namespace/repo/tree/refs/convert/parquet`,
      `https://huggingface.co/${typePath}namespace/repo/tree/refs%2Fconvert%2Fparquet`,
      'namespace/repo',
      type,
      'refs%2Fconvert%2Fparquet',
      '',
    ],
    // PRs are also accepted
    [
      `https://huggingface.co/${typePath}namespace/repo/tree/refs/pr/9`,
      `https://huggingface.co/${typePath}namespace/repo/tree/refs%2Fpr%2F9`,
      'namespace/repo',
      type,
      'refs%2Fpr%2F9',
      '',
    ],
    // Subdirectories
    [
      `https://huggingface.co/${typePath}namespace/repo/tree/branch/folder`,
      `https://huggingface.co/${typePath}namespace/repo/tree/branch/folder`,
      'namespace/repo',
      type,
      'branch',
      '/folder',
    ],
    [
      `https://huggingface.co/${typePath}namespace/repo/tree/branch/a/b/c/`,
      `https://huggingface.co/${typePath}namespace/repo/tree/branch/a/b/c`,
      'namespace/repo',
      type,
      'branch',
      '/a/b/c',
    ],
    // A subdirectory can have a dot in its name (what matters is 'tree' vs 'blob' or 'resolve')
    [
      `https://huggingface.co/${typePath}namespace/repo/tree/branch/folder.parquet`,
      `https://huggingface.co/${typePath}namespace/repo/tree/branch/folder.parquet`,
      'namespace/repo',
      type,
      'branch',
      '/folder.parquet',
    ],
  ]))(
    'parses a DirectoryUrl for $type root or subdirectory: %s',
    ([url, source, repo, type, branch, path]) => {
      expect(parseHuggingFaceUrl(url)).toEqual({
        kind: 'directory',
        origin,
        repo,
        type,
        source,
        action: 'tree',
        branch,
        path,
      })
    }
  )

  const repo = 'namespace/repo'
  const path = '/path/to/file.parquet'
  test.for(
    [
      { type: 'dataset', typePath: 'datasets/' },
      { type: 'space', typePath: 'spaces/' },
      { type: 'model', typePath: '' },
    ].flatMap(d => [
      { ...d, branch: 'branch', sanitizedBranch: 'branch' },
      { ...d, branch: 'refs/convert/parquet', sanitizedBranch: 'refs%2Fconvert%2Fparquet' },
      { ...d, branch: 'refs%2Fconvert%2Fparquet', sanitizedBranch: 'refs%2Fconvert%2Fparquet' },
    ]).flatMap(d => [
      { ...d, action: 'blob' },
      { ...d, action: 'resolve' },
    ]).flatMap(d => [
      { ...d, url: `https://huggingface.co/${d.typePath}${repo}/${d.action}/${d.branch}${path}` },
    ]))(
    'parses a FileUrl for $type file URL: $url',
    ({ type, typePath, sanitizedBranch, action, url }) => {
      const source = `https://huggingface.co/${typePath}${repo}/${action}/${sanitizedBranch}${path}`
      const resolveUrl = `https://huggingface.co/${typePath}${repo}/resolve/${sanitizedBranch}${path}`
      expect(parseHuggingFaceUrl(url)).toEqual({
        kind: 'file',
        origin,
        repo,
        type,
        source,
        action,
        branch: sanitizedBranch,
        path,
        resolveUrl,
      })
    }
  )
})
