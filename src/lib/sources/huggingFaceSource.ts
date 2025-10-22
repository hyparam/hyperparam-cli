import type { DirSource, FileMetadata, FileSource, SourcePart } from './types.js'
import { getFileName } from './utils.js'

type RepoType = 'model' | 'dataset' | 'space'

interface BaseUrl {
  source: string
  origin: string
  type: RepoType
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
  action: 'resolve' | 'blob'
  resolveUrl: string
}

type HFUrl = DirectoryUrl | FileUrl;

interface RefResponse {
  name: string;
  ref: string;
  targetCommit: string;
}

const refTypes = [
  'branches',
  'tags',
  'converts',
  'pullRequests',
] as const
type RefType = (typeof refTypes)[number];
type RefsResponse = Partial<Record<RefType, RefResponse[]>>;

interface RefMetadata extends RefResponse {
  refType: RefType; // TODO(SL): use it to style the refs differently?
}

const baseUrl = 'https://huggingface.co'

function getFullName(url: HFUrl): string {
  return url.type === 'dataset' ? `datasets/${url.repo}` : url.type === 'space' ? `spaces/${url.repo}` : url.repo
}
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
async function fetchFilesList(url: DirectoryUrl, options?: { requestInit?: RequestInit, accessToken?: string }): Promise<FileMetadata[]> {
  const repoFullName = getFullName(url)
  const filesIterator = listFiles({
    repoFullName,
    revision: url.branch,
    path: 'path' in url ? url.path.replace(/^\//, '') : '', // remove leading slash if any
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

  let { pathname } = urlObject
  let type: RepoType = 'model'
  if (pathname.startsWith('/datasets')) {
    type = 'dataset'
    pathname = pathname.slice('/datasets'.length)
  } else if (pathname.startsWith('/spaces')) {
    type = 'space'
    pathname = pathname.slice('/spaces'.length)
  }

  const repoGroups = /^\/(?<namespace>[^/]+)\/(?<repo>[^/]+)\/?$/.exec(
    pathname
  )?.groups
  if (repoGroups?.namespace !== undefined && repoGroups.repo !== undefined) {
    return {
      kind: 'directory',
      source: url,
      origin: urlObject.origin,
      type,
      repo: repoGroups.namespace + '/' + repoGroups.repo,
      action: 'tree',
      branch: 'main', // hardcode the default branch
      path: '',
    }
  }

  const folderGroups =
    /^\/(?<namespace>[^/]+)\/(?<repo>[^/]+)\/(?<action>tree)\/(?<branch>(refs\/(convert|pr)\/)?[^/]+)(?<path>(\/[^/]+)*)\/?$/.exec(
      pathname
    )?.groups
  if (
    folderGroups?.namespace !== undefined &&
    folderGroups.repo !== undefined &&
    folderGroups.action !== undefined &&
    folderGroups.branch !== undefined &&
    folderGroups.path !== undefined &&
    folderGroups.branch !== 'refs'
  ) {
    const typePath = type === 'dataset' ? '/datasets' : type === 'space' ? '/spaces' : ''
    const branch = folderGroups.branch.replace(/\//g, '%2F')
    const source = `${urlObject.origin}${typePath}/${folderGroups.namespace}/${folderGroups.repo}/${folderGroups.action}/${branch}${folderGroups.path}`
    return {
      kind: 'directory',
      source,
      origin: urlObject.origin,
      type,
      repo: folderGroups.namespace + '/' + folderGroups.repo,
      action: 'tree',
      branch,
      path: folderGroups.path,
    }
  }

  const fileGroups =
    /^\/(?<namespace>[^/]+)\/(?<repo>[^/]+)\/(?<action>blob|resolve)\/(?<branch>(refs\/(convert|pr)\/)?[^/]+)(?<path>(\/[^/]+)+)$/.exec(
      pathname
    )?.groups
  if (
    fileGroups?.namespace !== undefined &&
    fileGroups.repo !== undefined &&
    fileGroups.action !== undefined &&
    fileGroups.branch !== undefined &&
    fileGroups.path !== undefined &&
    fileGroups.branch !== 'refs'
  ) {
    const typePath = type === 'dataset' ? '/datasets' : type === 'space' ? '/spaces' : ''
    const branch = fileGroups.branch.replace(/\//g, '%2F')
    const source = `${urlObject.origin}${typePath}/${fileGroups.namespace}/${fileGroups.repo}/${fileGroups.action}/${branch}${fileGroups.path}`
    return {
      kind: 'file',
      source,
      origin: urlObject.origin,
      type,
      repo: fileGroups.namespace + '/' + fileGroups.repo,
      action: fileGroups.action === 'blob' ? 'blob' : 'resolve',
      branch,
      path: fileGroups.path,
      resolveUrl: `${urlObject.origin}${typePath}/${fileGroups.namespace}/${fileGroups.repo}/resolve/${branch}${fileGroups.path}`,
    }
  }

  throw new Error('Unsupported Hugging Face URL')
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
async function fetchRefsList(
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
  const response = await fetch(`https://huggingface.co/api/${url.type}s/${url.repo}/refs`, { ...options?.requestInit, headers })
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

/*
 * Copied and adapted from https://github.com/huggingface/huggingface.js/blob/main/packages/hub
 * MIT License, Copyright (c) 2023 Hugging Face
 */

interface ListFileEntry {
	type: 'file' | 'directory' | 'unknown';
	size: number;
  path: string;
  lastCommit?: {
		date: string;
		id: string;
	};
}

const HUB_URL = 'https://huggingface.co'

/**
 * List files in a folder. To list ALL files in the directory, call it
 * with {@link params.recursive} set to `true`.
 */
async function* listFiles(
  params: {
		repoFullName: string;
		/**
		 * Eg 'data' for listing all files in the 'data' folder. Leave it empty to list all
		 * files in the repo.
		 */
		path?: string;
		revision?: string;
		/**
		 * Custom fetch function to use instead of the default one, for example to use a proxy or edit headers.
		 */
    fetch?: typeof fetch;
    accessToken?: string;
	}
): AsyncGenerator<ListFileEntry> {
  let url: string | undefined = `${HUB_URL}/api/${params.repoFullName}/tree/${
    params.revision ?? 'main'
  }${params.path ? '/' + params.path : ''}?expand=true`

  while (url) {
    const res: Response = await (params.fetch ?? fetch)(url, {
      headers: {
        accept: 'application/json',
        ...params.accessToken ? { Authorization: `Bearer ${params.accessToken}` } : undefined,
      },
    })

    if (!res.ok) {
      throw new Error(`Failed to list files: ${res.status.toString()} ${res.statusText}`)
    }

    const items = await res.json() as ListFileEntry[]

    for (const item of items) {
      yield item
    }

    const linkHeader = res.headers.get('Link')

    url = linkHeader ? parseLinkHeader(linkHeader).next : undefined
  }
}

/**
 * Parse Link HTTP header, eg `<https://huggingface.co/api/datasets/bigscience/P3/tree/main?recursive=1&cursor=...>; rel="next"`
 */
export function parseLinkHeader(header: string): Record<string, string> {
  const regex = /<(https?:[/][/][^>]+)>;\s+rel="([^"]+)"/g

  return Object.fromEntries([...header.matchAll(regex)].map(([, url, rel]) => [rel, url])) as Record<string, string>
}
