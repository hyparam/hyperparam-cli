import type { DirSource, FileMetadata, FileSource, SourcePart } from './types.js'
import { getFileName } from './utils.js'

interface BaseUrl {
  source: string
  origin: string
  repo: string
  branch: string
  path: string
}

interface DirectoryUrl extends BaseUrl {
  kind: 'directory'
  action: 'tree'
}

interface FileUrl extends BaseUrl {
  kind: 'file'
  action?: 'blob' | 'raw/refs/heads'
  resolveUrl: string
}

interface RawFileUrl extends BaseUrl {
  kind: 'file'
  action: undefined
  resolveUrl: string
}

type GHUrl = DirectoryUrl | FileUrl | RawFileUrl

const baseUrl = 'https://github.com'
const baseRawUrl = 'https://raw.githubusercontent.com'

function getSourceParts(url: GHUrl): SourcePart[] {
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
function getPrefix(url: DirectoryUrl): string {
  return `${baseUrl}/${url.repo}/tree/${url.branch}${url.path}`.replace(/\/$/, '')
}
async function fetchFilesList(url: DirectoryUrl, options?: { requestInit?: RequestInit, accessToken?: string }): Promise<FileMetadata[]> {
  const apiURL = `https://api.github.com/repos/${url.repo}/contents/${url.path}?ref=${url.branch}`
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github+json',
  }
  if (options?.accessToken) {
    headers.Authorization = `token ${options.accessToken}`
  }
  const response = await fetch(apiURL, {
    method: 'GET',
    headers,
    ...options?.requestInit,
  })
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText} - ${await response.text()}`)
  }
  try {
    const data: unknown = await response.json()
    const isDirectory = Array.isArray(data)
    if (!isDirectory) {
      throw new Error('Not a directory')
    }
    const files: FileMetadata[] = []
    for (const file of data as unknown[]) {
      if (typeof file !== 'object' || file === null || !('name' in file) || !('path' in file) || !('type' in file) || !('size' in file)) {
        throw new Error('Invalid file metadata')
      }
      if (file.type !== 'file' && file.type !== 'dir') {
        throw new Error('Unsupported file type')
      }
      if (typeof file.name !== 'string' || typeof file.path !== 'string' || typeof file.size !== 'number') {
        throw new Error('Invalid file metadata types')
      }
      files.push({
        name: getFileName(file.path),
        fileSize: file.size,
        sourceId: `${url.origin}/${url.repo}/${file.type === 'file' ? 'blob' : 'tree'}/${url.branch}/${file.path}`.replace(/\/$/, ''),
        kind: file.type === 'file' ? 'file' : 'directory', // 'unknown' is considered as a directory
      })
    }
    return files
  } catch (error) {
    throw new Error(`Failed to parse GitHub API response: ${error instanceof Error ? error.message : String(error)}`)
  }
}
export function getGitHubSource(sourceId: string, options?: {requestInit?: RequestInit, accessToken?: string}): FileSource | DirSource | undefined {
  try {
    const url = parseGitHubUrl(sourceId)
    // async function fetchVersions() {
    //   const refsList = await fetchRefsList(url, options)
    //   return {
    //     label: 'Branches',
    //     versions: refsList.map(({ refType, name, ref }) => {
    //       const label = refType === 'branches' ? name :
    //         refType === 'converts' ? `[convert] ${name}` :
    //           refType === 'tags' ? `[tag] ${name}` :
    //             `[pr] ${name}`
    //       // remove refs/heads/ from the ref name
    //       // e.g. refs/heads/main -> main
    //       const fixedRef = refType === 'branches' ? ref.replace(/refs\/heads\//, '') : ref
    //       const branchSourceId = `${url.origin}/${getFullName(url)}/${url.kind === 'file' ? 'blob' : 'tree'}/${fixedRef}${url.path}`
    //       return {
    //         label,
    //         sourceId: branchSourceId,
    //       }
    //     }),
    //   }
    // }
    if (url.kind === 'file') {
      return {
        kind: 'file',
        sourceId,
        sourceParts: getSourceParts(url),
        fileName: getFileName(url.path),
        resolveUrl: url.resolveUrl,
        requestInit: options?.requestInit,
        // fetchVersions,
      }
    } else {
      return {
        kind: 'directory',
        sourceId,
        sourceParts: getSourceParts(url),
        prefix: getPrefix(url),
        listFiles: () => fetchFilesList(url, options),
        // fetchVersions,
      }
    }
  } catch {
    return undefined
  }
}

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
      kind: 'directory',
      source: url,
      origin: urlObject.origin,
      repo: repoGroups.owner + '/' + repoGroups.repo,
      action: 'tree',
      branch: 'main', // hardcode the default branch
      path: '',
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
    /^\/(?<owner>[^/]+)\/(?<repo>[^/]+)\/(?<action>blob|refs\/heads|raw\/refs\/heads)\/(?<branch>[^/]+)(?<path>(\/[^/]+)+)$/.exec(
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
      action: fileGroups.action === 'blob' ? 'blob' : 'raw/refs/heads',
      branch,
      path: fileGroups.path,
      resolveUrl: `${baseRawUrl}/${fileGroups.owner}/${fileGroups.repo}/refs/heads/${branch}${fileGroups.path}`,
    }
  }

  throw new Error('Unsupported GitHub URL')
}
