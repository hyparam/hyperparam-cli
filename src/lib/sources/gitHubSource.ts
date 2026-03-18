import type { DirSource, FileMetadata, FileSource, SourcePart } from './types.js'
import { getFileName } from './utils.js'

interface BaseUrl {
  source: string
  origin: string
  repo: string
}

interface RepoUrl extends BaseUrl {
  kind: 'repo'
}

interface PathUrl extends BaseUrl {
  branch: string
  path: string
}

interface DirectoryUrl extends PathUrl {
  kind: 'directory'
  action: 'tree'
}

interface FileUrl extends PathUrl {
  kind: 'file'
  action?: 'blob' | 'raw' | 'raw/refs/heads'
  resolveUrl: string
}

interface RawFileUrl extends PathUrl {
  kind: 'file'
  action: undefined
  resolveUrl: string
}

type GHUrl = RepoUrl | DirectoryUrl | FileUrl | RawFileUrl

const baseUrl = 'https://github.com'
const baseRawUrl = 'https://raw.githubusercontent.com'

function getSourceParts(url: GHUrl): SourcePart[] {
  if (url.kind === 'repo') {
    return [{
      sourceId: `${baseUrl}/${url.repo}`,
      text: `${baseUrl}/${url.repo}`,
    }]
  }

  const sourceParts: SourcePart[] = [{
    sourceId: `${baseUrl}/${url.repo}/tree/${url.branch}/`,
    text: `${baseUrl}/${url.repo}/tree/${url.branch}/`,
  }]

  const pathParts = url.path.split('/').filter(d => d.length > 0)
  const lastPart = pathParts.at(-1)
  if (lastPart) {
    for (const [i, part] of pathParts.slice(0, -1).entries()) {
      sourceParts.push({
        sourceId: `${baseUrl}/${url.repo}/tree/${url.branch}/${pathParts.slice(0, i + 1).join('/')}`,
        text: part + '/',
      })
    }
    sourceParts.push({
      sourceId: `${baseUrl}/${url.repo}/${url.action === 'tree' ? 'tree/' : 'blob/'}${url.branch}${url.path}`,
      text: lastPart,
    })
  }
  return sourceParts
}
async function fetchFilesList(url: DirectoryUrl | RepoUrl, options?: { requestInit?: RequestInit, accessToken?: string }): Promise<FileMetadata[]> {
  const path = url.kind === 'repo' ? '/' : url.path
  const branchParam = url.kind === 'repo' ? '' : `?ref=${url.branch}`
  const apiURL = `https://api.github.com/repos/${url.repo}/contents${path}${branchParam}`
  const headers = new Headers(options?.requestInit?.headers)
  headers.set('Accept', 'application/vnd.github+json')
  if (options?.accessToken) {
    headers.set('Authorization', `Bearer ${options.accessToken}`)
  }
  const response = await fetch(apiURL, {
    ...options?.requestInit,
    method: 'GET',
    headers,
  })
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText} - ${await response.text()}`)
  }
  try {
    const data = await response.json() as {html_url: string, path: string, type: 'file' | 'dir', size: number}[]
    return data.map((file) => ({
      name: getFileName(file.path),
      fileSize: file.size,
      sourceId: file.html_url,
      kind: file.type === 'file' ? 'file' : 'directory',
    }))
  } catch (error) {
    throw new Error(`Failed to parse GitHub API response: ${error instanceof Error ? error.message : String(error)}`)
  }
}
export function getGitHubSource(sourceId: string, options?: {requestInit?: RequestInit, accessToken?: string}): FileSource | DirSource | undefined {
  try {
    const url = parseGitHubUrl(sourceId)
    const path = url.kind === 'repo' ? '/' : url.path
    async function fetchVersions() {
      const branches = await fetchBranchesList(url, options)
      return {
        label: 'Branches',
        versions: branches.filter(
          // TODO(SL): support branches with slashes in their names (feature/foo/bar)
          branch => !branch.includes('/')
        ).map((branch) => {
          const branchSourceId = `${baseUrl}/${url.repo}/${url.kind === 'file' ? 'blob' : 'tree'}/${branch}${path}`
          return {
            label: branch,
            sourceId: branchSourceId,
          }
        }),
      }
    }
    if (url.kind === 'file') {
      return {
        kind: 'file',
        sourceId,
        sourceParts: getSourceParts(url),
        fileName: getFileName(url.path),
        resolveUrl: url.resolveUrl,
        requestInit: options?.requestInit,
        fetchVersions,
      }
    } else {
      return {
        kind: 'directory',
        sourceId,
        sourceParts: getSourceParts(url),
        listFiles: () => fetchFilesList(url, options),
        fetchVersions,
      }
    }
  } catch {
    return undefined
  }
}

// TODO(SL): support branches with slashes in their names (feature/foo)
export function parseGitHubUrl(url: string): GHUrl {
  const urlObject = new URL(url)
  // ^ throws 'TypeError: URL constructor: {url} is not a valid URL.' if url is not a valid URL

  if (
    urlObject.protocol !== 'https:' ||
    ![
      'github.co', 'github.com', 'www.github.com', 'raw.githubusercontent.com',
    ].includes(urlObject.host)
  ) {
    throw new Error('Not a GitHub URL')
  }

  const { pathname } = urlObject

  if (urlObject.host === 'raw.githubusercontent.com') {
    // https://raw.githubusercontent.com/apache/parquet-testing/refs/heads/master/variant/README.md
    const rawFileGroups =
        /^\/(?<owner>[^/]+)\/(?<repo>[^/]+)\/(?<action>(refs\/heads\/)?)(?<branch>[^/]+)(?<path>(\/[^/]+)+)$/.exec(
          pathname
        )?.groups
    if (
      rawFileGroups?.owner !== undefined &&
      rawFileGroups.repo !== undefined &&
      rawFileGroups.branch !== undefined &&
      rawFileGroups.path !== undefined
    ) {
      const branch = rawFileGroups.branch.replace(/\//g, '%2F')
      const source = `${urlObject.origin}/${rawFileGroups.owner}/${rawFileGroups.repo}/${branch}${rawFileGroups.path}`
      return {
        kind: 'file',
        source,
        origin: urlObject.origin,
        repo: rawFileGroups.owner + '/' + rawFileGroups.repo,
        branch,
        path: rawFileGroups.path,
        resolveUrl: source,
      }
    } else {
      throw new Error('Unsupported GitHub URL')
    }
  }

  const repoGroups = /^\/(?<owner>[^/]+)\/(?<repo>[^/]+)\/?$/.exec(
    pathname
  )?.groups
  if (repoGroups?.owner !== undefined && repoGroups.repo !== undefined) {
    return {
      kind: 'repo',
      source: url,
      origin: urlObject.origin,
      repo: repoGroups.owner + '/' + repoGroups.repo,
    }
  }

  const folderGroups =
    /^\/(?<owner>[^/]+)\/(?<repo>[^/]+)\/(?<action>tree)\/(?<branch>[^/]+)(?<path>(\/[^/]+)*)\/?$/.exec(
      pathname
    )?.groups
  if (
    folderGroups?.owner !== undefined &&
    folderGroups.repo !== undefined &&
    folderGroups.action !== undefined &&
    folderGroups.branch !== undefined &&
    folderGroups.path !== undefined
  ) {
    const branch = folderGroups.branch.replace(/\//g, '%2F')
    const source = `${urlObject.origin}/${folderGroups.owner}/${folderGroups.repo}/${folderGroups.action}/${branch}${folderGroups.path}`
    return {
      kind: 'directory',
      source,
      origin: urlObject.origin,
      repo: folderGroups.owner + '/' + folderGroups.repo,
      action: 'tree',
      branch,
      path: folderGroups.path,
    }
  }

  // https://github.com/apache/parquet-testing/blob/master/variant/README.md
  // https://github.com/apache/parquet-testing/raw/refs/heads/master/variant/README.md
  const fileGroups =
    /^\/(?<owner>[^/]+)\/(?<repo>[^/]+)\/(?<action>blob|raw|raw\/refs\/heads)\/(?<branch>[^/]+)(?<path>(\/[^/]+)+)$/.exec(
      pathname
    )?.groups
  if (
    fileGroups?.owner !== undefined &&
    fileGroups.repo !== undefined &&
    fileGroups.action !== undefined &&
    fileGroups.branch !== undefined &&
    fileGroups.path !== undefined
  ) {
    const branch = fileGroups.branch.replace(/\//g, '%2F')
    const source = `${urlObject.origin}/${fileGroups.owner}/${fileGroups.repo}/${fileGroups.action}/${branch}${fileGroups.path}`
    return {
      kind: 'file',
      source,
      origin: urlObject.origin,
      repo: fileGroups.owner + '/' + fileGroups.repo,
      action: fileGroups.action === 'blob' ? 'blob' : fileGroups.action === 'raw' ? 'raw' : 'raw/refs/heads',
      branch,
      path: fileGroups.path,
      resolveUrl: `${baseRawUrl}/${fileGroups.owner}/${fileGroups.repo}/${branch}${fileGroups.path}`,
    }
  }

  throw new Error('Unsupported GitHub URL')
}

/**
 * List branches in a GitHub dataset repo
 *
 * Example API URL: https://api.github.com/repos/owner/repo/branches
 *
 * @param repo (namespace/repo)
 * @param [options]
 * @param [options.requestInit] - request init object to pass to fetch
 * @param [options.accessToken] - access token to use for authentication
 *
 * @returns the list of branch names
 */
async function fetchBranchesList(
  url: GHUrl,
  options?: {requestInit?: RequestInit, accessToken?: string}
): Promise<string[]> {
  const headers = new Headers(options?.requestInit?.headers)
  headers.set('accept', 'application/vnd.github+json')
  if (options?.accessToken) {
    headers.set('Authorization', `Bearer ${options.accessToken}`)
  }
  const response = await fetch(`https://api.github.com/repos/${url.repo}/branches`, { ...options?.requestInit, headers })
  if (!response.ok) {
    throw new Error(`HTTP error ${response.statusText} (${response.status})`)
  }
  const branches = await response.json() as {name: string}[]
  return branches.map(({ name }) => name)
}
