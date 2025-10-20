import { listFiles } from '@huggingface/hub'
import type { DirSource, FileMetadata, FileSource, SourcePart } from './types.js'
import { getFileName } from './utils.js'

export const baseUrl = 'https://huggingface.co/datasets'

function getSourceParts(url: HFUrl): SourcePart[] {
  const sourceParts: SourcePart[] = [{
    sourceId: `${baseUrl}/${url.repo}/tree/${url.branch}/`,
    text: `${baseUrl}/${url.repo}/${url.action}/${url.branch}/`,
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
      sourceId: `${baseUrl}/${url.repo}/${url.action}/${url.branch}${url.path}`,
      text: lastPart,
    })
  }
  return sourceParts
}
function getPrefix(url: DirectoryUrl): string {
  return `${url.origin}/datasets/${url.repo}/tree/${url.branch}${url.path}`.replace(/\/$/, '')
}
async function fetchFilesList(url: DirectoryUrl, options?: {requestInit?: RequestInit, accessToken?: string}): Promise<FileMetadata[]> {
  const filesIterator = listFiles({
    repo: `datasets/${url.repo}`,
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
      sourceId: `${url.origin}/datasets/${url.repo}/${file.type === 'file' ? 'blob' : 'tree'}/${url.branch}/${file.path}`.replace(/\/$/, ''),
      kind: file.type === 'file' ? 'file' : 'directory', // 'unknown' is considered as a directory
    })
  }
  return files
}
export function getHuggingFaceSource(sourceId: string, options?: {requestInit?: RequestInit, accessToken?: string}): FileSource | DirSource | undefined {
  try {
    const url = parseHuggingFaceUrl(sourceId)
    async function fetchVersions() {
      const refsList = await fetchRefsList(url.repo, options)
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
          const branchSourceId = `${url.origin}/datasets/${url.repo}/${url.kind === 'file' ? 'blob' : 'tree'}/${fixedRef}${url.path}`
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

export interface DirectoryUrl {
  kind: 'directory';
  source: string;
  origin: string;
  repo: string;
  action: 'tree';
  branch: string;
  path: string;
}

export interface FileUrl {
  kind: 'file';
  source: string;
  origin: string;
  repo: string;
  action: 'resolve' | 'blob';
  branch: string;
  path: string;
  resolveUrl: string;
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

  const repoGroups = /^\/datasets\/(?<namespace>[^/]+)\/(?<dataset>[^/]+)\/?$/.exec(
    urlObject.pathname
  )?.groups
  if (repoGroups?.namespace !== undefined && repoGroups.dataset !== undefined) {
    return {
      kind: 'directory',
      source: url,
      origin: urlObject.origin,
      repo: repoGroups.namespace + '/' + repoGroups.dataset,
      action: 'tree',
      branch: 'main', // hardcode the default branch
      path: '',
    }
  }

  const folderGroups =
    /^\/datasets\/(?<namespace>[^/]+)\/(?<dataset>[^/]+)\/(?<action>tree)\/(?<branch>(refs\/(convert|pr)\/)?[^/]+)(?<path>(\/[^/]+)*)\/?$/.exec(
      urlObject.pathname
    )?.groups
  if (
    folderGroups?.namespace !== undefined &&
    folderGroups.dataset !== undefined &&
    folderGroups.action !== undefined &&
    folderGroups.branch !== undefined &&
    folderGroups.path !== undefined &&
    folderGroups.branch !== 'refs'
  ) {
    const branch = folderGroups.branch.replace(/\//g, '%2F')
    const source = `${urlObject.origin}/datasets/${folderGroups.namespace}/${folderGroups.dataset}/${folderGroups.action}/${branch}${folderGroups.path}`
    return {
      kind: 'directory',
      source,
      origin: urlObject.origin,
      repo: folderGroups.namespace + '/' + folderGroups.dataset,
      action: 'tree',
      branch,
      path: folderGroups.path,
    }
  }

  const fileGroups =
    /^\/datasets\/(?<namespace>[^/]+)\/(?<dataset>[^/]+)\/(?<action>blob|resolve)\/(?<branch>(refs\/(convert|pr)\/)?[^/]+)(?<path>(\/[^/]+)+)$/.exec(
      urlObject.pathname
    )?.groups
  if (
    fileGroups?.namespace !== undefined &&
    fileGroups.dataset !== undefined &&
    fileGroups.action !== undefined &&
    fileGroups.branch !== undefined &&
    fileGroups.path !== undefined &&
    fileGroups.branch !== 'refs'
  ) {
    const branch = fileGroups.branch.replace(/\//g, '%2F')
    const source = `${urlObject.origin}/datasets/${fileGroups.namespace}/${fileGroups.dataset}/${fileGroups.action}/${branch}${fileGroups.path}`
    return {
      kind: 'file',
      source,
      origin: urlObject.origin,
      repo: fileGroups.namespace + '/' + fileGroups.dataset,
      action: fileGroups.action === 'blob' ? 'blob' : 'resolve',
      branch,
      path: fileGroups.path,
      resolveUrl: `${urlObject.origin}/datasets/${fileGroups.namespace}/${fileGroups.dataset}/resolve/${branch}${fileGroups.path}`,
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
  repo: string,
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
  const response = await fetch(`https://huggingface.co/api/datasets/${repo}/refs`, { ...options?.requestInit, headers })
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
