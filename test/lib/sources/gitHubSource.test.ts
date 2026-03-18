import { describe, expect, it, test } from 'vitest'
import { getGitHubSource, parseGitHubUrl } from '../../../src/lib/sources/gitHubSource.js'

describe('parseGitHubUrl', () => {
  test.for([
    'github.co',
    'github.com',
    'www.github.com',
  ])('accepts domain: %s', (domain) => {
    const origin = `https://${domain}`
    const url = `${origin}/owner/repo`
    expect(parseGitHubUrl(url)).toEqual({
      kind: 'directory',
      origin,
      repo: 'owner/repo',
      source: url,
      action: 'tree',
      branch: 'main',
      path: '',
    })
  })

  it('throws for unsupported scheme or domain', () => {
    expect(() => parseGitHubUrl('ftp://github.com/owner/repo')).toThrow()
    expect(() => parseGitHubUrl('email://github.com/owner/repo')).toThrow()
    expect(() => parseGitHubUrl('http://github.com/owner/repo')).toThrow()
    expect(() => parseGitHubUrl('https://hf.com/owner/repo')).toThrow()
    expect(() => parseGitHubUrl('https://huggingface.co/owner/repo')).toThrow()
    expect(() => parseGitHubUrl('github.com/owner/repo')).toThrow()
  })

  test.for([
    '',
    '/',
    // for the following tests, the same is true with a trailing slash
    // Avoiding for brevity.
    '/owner',
    '/owner/repo/branch',
    '/owner/repo/tree',
    '/owner/repo/blob',
    '/owner/repo/blob/branch',
    // note the trailing slash
    '/owner/repo/blob/branch/file/',
  ])('throws for invalid path: %s', (path) => {
    expect(() => parseGitHubUrl(`https://github.com${path}`)).to.throw()
  })

  test.for([
    // Root directory
    [
      'https://github.com/owner/repo',
      'https://github.com/owner/repo',
      'owner/repo',
      'main',
      '',
    ],
    [
      'https://github.com/owner/repo/',
      'https://github.com/owner/repo/',
      'owner/repo',
      'main',
      '',
    ],
    // all-number identifier is not a valid GitHub repo name, but we accept any string
    [
      'https://github.com/owner/123',
      'https://github.com/owner/123',
      'owner/123',
      'main',
      '',
    ],
    // Branches
    [
      'https://github.com/owner/repo/tree/branch',
      'https://github.com/owner/repo/tree/branch',
      'owner/repo',
      'branch',
      '',
    ],
    [
      'https://github.com/owner/repo/tree/branch/',
      'https://github.com/owner/repo/tree/branch',
      'owner/repo',
      'branch',
      '',
    ],
    // Subdirectories
    [
      'https://github.com/owner/repo/tree/branch/folder',
      'https://github.com/owner/repo/tree/branch/folder',
      'owner/repo',
      'branch',
      '/folder',
    ],
    [
      'https://github.com/owner/repo/tree/branch/a/b/c/',
      'https://github.com/owner/repo/tree/branch/a/b/c',
      'owner/repo',
      'branch',
      '/a/b/c',
    ],
    // A subdirectory can have a dot in its name (what matters is 'tree' vs 'blob')
    [
      'https://github.com/owner/repo/tree/branch/folder.parquet',
      'https://github.com/owner/repo/tree/branch/folder.parquet',
      'owner/repo',
      'branch',
      '/folder.parquet',
    ],
  ])(
    'parses a DirectoryUrl for root or subdirectory: %s',
    ([url, source, repo, branch, path]) => {
      expect(parseGitHubUrl(url)).toEqual({
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

  const origin = 'https://github.com'
  const branch = 'branch'
  const repo = 'owner/repo'
  const path = '/path/to/file.parquet'
  it('parses a FileUrl for file URL', () => {
    const url = `https://github.com/${repo}/blob/${branch}${path}`
    const resolveUrl = `https://raw.githubusercontent.com/${repo}/${branch}${path}`
    expect(parseGitHubUrl(url)).toEqual({
      kind: 'file',
      origin,
      repo,
      source: url,
      action: 'blob',
      branch,
      path,
      resolveUrl,
    })
  }
  )
})

describe('getGitHubSource', () => {
  describe('source parts', () => {
    it('returns the URL for a repository URL', () => {
      const url = 'https://github.com/owner/repo'
      expect(getGitHubSource(url)?.sourceParts).toEqual([{
        sourceId: 'https://github.com/owner/repo/tree/main/',
        text: 'https://github.com/owner/repo/tree/main/',
      }])
    })
    it('returns the URL for a branch root URL', () => {
      const url = 'https://github.com/owner/repo/tree/branch'
      expect(getGitHubSource(url)?.sourceParts).toEqual([{
        sourceId: 'https://github.com/owner/repo/tree/branch/',
        text: 'https://github.com/owner/repo/tree/branch/',
      }])
    })
    it('returns the URL then every parent directory for a branch subdirectory URL', () => {
      const url = 'https://github.com/owner/repo/tree/branch/a/b/c'
      expect(getGitHubSource(url)?.sourceParts).toEqual([
        {
          sourceId: 'https://github.com/owner/repo/tree/branch/',
          text: 'https://github.com/owner/repo/tree/branch/',
        },
        {
          sourceId: 'https://github.com/owner/repo/tree/branch/a',
          text: 'a/',
        },
        {
          sourceId: 'https://github.com/owner/repo/tree/branch/a/b',
          text: 'b/',
        },
        {
          sourceId: 'https://github.com/owner/repo/tree/branch/a/b/c',
          text: 'c',
        },
      ])
    })
    it('returns the URL then every parent directory then the blob URL for a file URL', () => {
      const url = 'https://github.com/owner/repo/blob/branch/a/b/c/file.parquet'
      expect(getGitHubSource(url)?.sourceParts).toEqual([
        {
          sourceId: 'https://github.com/owner/repo/tree/branch/',
          text: 'https://github.com/owner/repo/tree/branch/',
        },
        {
          sourceId: 'https://github.com/owner/repo/tree/branch/a',
          text: 'a/',
        },
        {
          sourceId: 'https://github.com/owner/repo/tree/branch/a/b',
          text: 'b/',
        },
        {
          sourceId: 'https://github.com/owner/repo/tree/branch/a/b/c',
          text: 'c/',
        },
        {
          sourceId: 'https://github.com/owner/repo/blob/branch/a/b/c/file.parquet',
          text: 'file.parquet',
        },
      ])
    })
    test.for([
      'https://raw.githubusercontent.com/owner/repo/branch/a/b/c/file.parquet',
      'https://raw.githubusercontent.com/owner/repo/refs/heads/branch/a/b/c/file.parquet',
    ])('returns github.com parts for a raw URL', (url) => {
      expect(getGitHubSource(url)?.sourceParts).toEqual([
        {
          sourceId: 'https://github.com/owner/repo/tree/branch/',
          text: 'https://github.com/owner/repo/tree/branch/',
        },
        {
          sourceId: 'https://github.com/owner/repo/tree/branch/a',
          text: 'a/',
        },
        {
          sourceId: 'https://github.com/owner/repo/tree/branch/a/b',
          text: 'b/',
        },
        {
          sourceId: 'https://github.com/owner/repo/tree/branch/a/b/c',
          text: 'c/',
        },
        {
          sourceId: 'https://github.com/owner/repo/blob/branch/a/b/c/file.parquet',
          text: 'file.parquet',
        },
      ])
    })
  })
})
