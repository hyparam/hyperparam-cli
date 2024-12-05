import type { DirSource, FileKind, FileMetadata, FileSource, SourcePart } from './types.js'
import { getFileName } from './utils.js'

export interface HyperparamFileMetadata {
  key: string
  eTag?: string
  fileSize?: number
  lastModified: string
}

function canParse(sourceId: string): boolean {
  /// we expect relative paths, such as path/to/file or path/to/dir/
  /// let's just check that it is empty or starts with a "word" character
  return sourceId === '' || /^[\w]/.test(sourceId)
}

function getSourceParts(sourceId: string): SourcePart[] {
  const parts = sourceId.split('/')
  return [
    { 'text': '/', 'sourceId': '' },
    ...parts.map((part, depth) => {
      const slashSuffix = depth === parts.length - 1 ? '' : '/'
      return {
        text: part + slashSuffix,
        sourceId: parts.slice(0, depth + 1).join('/') + slashSuffix,
      }
    }),
  ]
}

function getKind(sourceId: string): FileKind {
  return sourceId === '' || sourceId.endsWith('/') ? 'directory' : 'file'
}

function getResolveUrl(sourceId: string, { endpoint }: {endpoint: string}): string {
  const url = new URL('/api/store/get', endpoint)
  url.searchParams.append('key', sourceId)
  return url.toString()
}

function getPrefix(sourceId: string): string {
  return sourceId.replace(/\/$/, '')
}

async function listFiles(prefix: string, { endpoint, requestInit }: {endpoint: string, requestInit?: RequestInit}): Promise<FileMetadata[]> {
  const url = new URL('/api/store/list', endpoint)
  url.searchParams.append('prefix', prefix)
  const res = await fetch(url, requestInit)
  if (res.ok) {
    const files = await res.json() as HyperparamFileMetadata[]
    return files.map(file => ({
      name: file.key,
      eTag: file.eTag,
      size: file.fileSize,
      lastModified: file.lastModified,
      sourceId: (prefix === '' ? '' : prefix + '/') + file.key,
      kind: getKind(file.key),
    }))
  } else {
    throw new Error(await res.text())
  }
}

export function getHyperparamSource(sourceId: string, { endpoint, requestInit }: {endpoint: string, requestInit?: RequestInit}): FileSource | DirSource | undefined {
  if (!URL.canParse(endpoint)) {
    throw new Error('Invalid endpoint')
  }
  if (!canParse(sourceId)) {
    return undefined
  }
  const sourceParts = getSourceParts(sourceId)
  if (getKind(sourceId) === 'file') {
    return {
      kind: 'file',
      sourceId,
      sourceParts,
      fileName: getFileName(sourceId),
      resolveUrl: getResolveUrl(sourceId, { endpoint }),
      requestInit,
    }
  } else {
    const prefix = getPrefix(sourceId)
    return {
      kind: 'directory',
      sourceId,
      sourceParts,
      prefix,
      listFiles: () => listFiles(prefix, { endpoint, requestInit }),
    }
  }
}


