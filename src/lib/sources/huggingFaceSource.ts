import { type RepoFullName, type RepoType, listFiles, parseRepoType } from '@huggingface/hub'
import type { DirSource, FileMetadata, FileSource, SourcePart } from './types.js'
import { getFileName } from './utils.js'

export const baseUrl = 'https://huggingface.co'

function getSourceParts(url: HFUrl): SourcePart[] {
  const fullName = getFullName(url)
  const sourceParts: SourcePart[] = [{
    sourceId: `${baseUrl}/${fullName}/tree/${url.branch}/`,
    text: `${baseUrl}/${fullName}/${url.action}/${url.branch}/`,
  }]

  const pathParts = url.path.split('/').filter(d => d.length > 0)
  const lastPart = pathParts.at(-1)
  if (lastPart) {
    for (const [i, part] of pathParts.slice(0, -1).entries()) {
      sourceParts.push({
        sourceId: `${baseUrl}/${fullName}/tree/${url.branch}/${pathParts.slice(0, i + 1).join('/')}`,
        text: part + '/',
      })
    }
    sourceParts.push({
      sourceId: `${baseUrl}/${fullName}/${url.action}/${url.branch}${url.path}`,
      text: lastPart,
    })
  }
  return sourceParts
}
function getPrefix(url: DirectoryUrl): string {
  return `${url.origin}/${getFullName(url)}/tree/${url.branch}${url.path}`.replace(/\/$/, '')
}
function getFullName(url: HFUrl): RepoFullName {
  return url.type === 'dataset' ? `datasets/${url.repo}` : url.type === 'space' ? `spaces/${url.repo}` : url.repo
}
async function fetchFilesList(url: DirectoryUrl, options?: {requestInit?: RequestInit, accessToken?: string}): Promise<FileMetadata[]> {
  const filesIterator = listFiles({
    repo: {
      name: url.repo,
      type: url.type,
    },
    revision: url.branch,
    path: 'path' in url ? url.path.replace(/^\//, '') : '', // remove leading slash if any
    expand: true,
    accessToken: options?.accessToken,
  })
  const files: FileMetadata[] = []
  for await (const file of filesIterator) {
    files.push({
      name: getFileName(file.path),
      eTag: file.lastCommit?.id,
      size: file.size,
      lastModified: file.lastCommit?.date,
      sourceId: `${url.origin}/${getFullName(url)}/${file.type === 'file' ? 'blob' : 'tree'}/${url.branch}/${file.path}`.replace(/\/$/, ''),
      kind: file.type === 'file' ? 'file' : 'directory', // 'unknown' is considered as a directory
    })
  }
  return files
}
export function getHuggingFaceSource(sourceId: string, options?: {requestInit?: RequestInit, accessToken?: string}): FileSource | DirSource | undefined {
  try {
    const url = parseHuggingFaceUrl(sourceId)
    async function fetchVersions() {
      const refsList = await fetchRefsList(url, options)
      return {
        label: 'Branches',
        versions: refsList.map(({ refType, name, ref }) => {
          const label = refType === 'branches' ? name :
            refType === 'converts' ? `[convert] ${name}` :
              refType === 'tags' ? `[tag] ${name}` :
                `[pr] ${name}`
          // remove refs/heads/ from the ref name
          // e.g. refs/heads/main -> main
          const fixedRef = refType === 'branches' ? ref.replace(/refs\/heads\//, '') : ref
          const branchSourceId = `${url.origin}/${getFullName(url)}/${url.kind === 'file' ? 'blob' : 'tree'}/${fixedRef}${url.path}`
          return {
            label,
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
        prefix: getPrefix(url),
        listFiles: () => fetchFilesList(url, options),
        fetchVersions,
      }
    }
  } catch {
    return undefined
  }
}

interface BaseUrl {
  source: string
  origin: string
  type: RepoType
  repo: string
  branch: string
  path: string
}

export interface DirectoryUrl extends BaseUrl {
  kind: 'directory'
  action: 'tree'
}

export interface FileUrl extends BaseUrl {
  kind: 'file'
  action: 'resolve' | 'blob'
  resolveUrl: string
}

type HFUrl = DirectoryUrl | FileUrl;

export function parseHuggingFaceUrl(url: string): HFUrl {
  const urlObject = new URL(url)
  // ^ throws 'TypeError: URL constructor: {url} is not a valid URL.' if url is not a valid URL

  if (
    urlObject.protocol !== 'https:' ||
    ![
      'huggingface.co', 'huggingface.com', 'hf.co',
      // hf.com is not a HF domain
    ].includes(urlObject.host)
  ) {
    throw new Error('Not a Hugging Face URL')
  }

  const repoGroups = /^(?<type>\/datasets|\/spaces)\/(?<namespace>[^/]+)\/(?<repo>[^/]+)\/?$/.exec(
    urlObject.pathname
  )?.groups
  if (repoGroups?.type !== undefined && repoGroups.namespace !== undefined && repoGroups.repo !== undefined) {
    return {
      kind: 'directory',
      source: url,
      origin: urlObject.origin,
      type: parseRepoType(repoGroups.type.slice(1)),
      repo: repoGroups.namespace + '/' + repoGroups.repo,
      action: 'tree',
      branch: 'main', // hardcode the default branch
      path: '',
    }
  }

  const folderGroups =
    /^(?<type>\/datasets|\/spaces)\/(?<namespace>[^/]+)\/(?<repo>[^/]+)\/(?<action>tree)\/(?<branch>(refs\/(convert|pr)\/)?[^/]+)(?<path>(\/[^/]+)*)\/?$/.exec(
      urlObject.pathname
    )?.groups
  if (
    folderGroups?.type !== undefined &&
    folderGroups.namespace !== undefined &&
    folderGroups.repo !== undefined &&
    folderGroups.action !== undefined &&
    folderGroups.branch !== undefined &&
    folderGroups.path !== undefined &&
    folderGroups.branch !== 'refs'
  ) {
    const branch = folderGroups.branch.replace(/\//g, '%2F')
    const source = `${urlObject.origin}${folderGroups.type}/${folderGroups.namespace}/${folderGroups.repo}/${folderGroups.action}/${branch}${folderGroups.path}`
    return {
      kind: 'directory',
      source,
      origin: urlObject.origin,
      type: parseRepoType(folderGroups.type.slice(1)),
      repo: folderGroups.namespace + '/' + folderGroups.repo,
      action: 'tree',
      branch,
      path: folderGroups.path,
    }
  }

  const fileGroups =
    /^(?<type>\/datasets|\/spaces)\/(?<namespace>[^/]+)\/(?<repo>[^/]+)\/(?<action>blob|resolve)\/(?<branch>(refs\/(convert|pr)\/)?[^/]+)(?<path>(\/[^/]+)+)$/.exec(
      urlObject.pathname
    )?.groups
  if (
    fileGroups?.type !== undefined &&
    fileGroups.namespace !== undefined &&
    fileGroups.repo !== undefined &&
    fileGroups.action !== undefined &&
    fileGroups.branch !== undefined &&
    fileGroups.path !== undefined &&
    fileGroups.branch !== 'refs'
  ) {
    const branch = fileGroups.branch.replace(/\//g, '%2F')
    const source = `${urlObject.origin}${fileGroups.type}/${fileGroups.namespace}/${fileGroups.repo}/${fileGroups.action}/${branch}${fileGroups.path}`
    return {
      kind: 'file',
      source,
      origin: urlObject.origin,
      type: parseRepoType(fileGroups.type.slice(1)),
      repo: fileGroups.namespace + '/' + fileGroups.repo,
      action: fileGroups.action === 'blob' ? 'blob' : 'resolve',
      branch,
      path: fileGroups.path,
      resolveUrl: `${urlObject.origin}${fileGroups.type}/${fileGroups.namespace}/${fileGroups.repo}/resolve/${branch}${fileGroups.path}`,
    }
  }

  throw new Error('Unsupported Hugging Face URL')
}

interface RefResponse {
  name: string;
  ref: string;
  targetCommit: string;
}

export const refTypes = [
  'branches',
  'tags',
  'converts',
  'pullRequests',
] as const
type RefType = (typeof refTypes)[number];
type RefsResponse = Partial<Record<RefType, RefResponse[]>>;

export interface RefMetadata extends RefResponse {
  refType: RefType; // TODO(SL): use it to style the refs differently?
}

/**
 * List refs in a HF dataset repo
 *
 * Example API URL: https://huggingface.co/api/datasets/codeparrot/github-code/refs
 *
 * @param repo (namespace/repo)
 * @param [options]
 * @param [options.requestInit] - request init object to pass to fetch
 * @param [options.accessToken] - access token to use for authentication
 *
 * @returns the list of branches, tags, pull requests, and converts
 */
export async function fetchRefsList(
  url: HFUrl,
  options?: {requestInit?: RequestInit, accessToken?: string}
): Promise<RefMetadata[]> {
  if (options?.accessToken && !options.accessToken.startsWith('hf_')) {
    throw new TypeError('Your access token must start with \'hf_\'')
  }
  const headers = new Headers(options?.requestInit?.headers)
  headers.set('accept', 'application/json')
  if (options?.accessToken) {
    headers.set('Authorization', `Bearer ${options.accessToken}`)
  }
  const response = await fetch(`https://huggingface.co/api/${getFullName(url)}/refs`, { ...options?.requestInit, headers })
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status.toString()}`)
  }
  const refsByType = await response.json() as RefsResponse
  return refTypes.flatMap((refType) => {
    const refResponse = refsByType[refType]
    if (!refResponse) {
      return []
    }
    return refResponse.map((refResponse) => {
      return {
        refType,
        ...refResponse,
      }
    })
  })
}
