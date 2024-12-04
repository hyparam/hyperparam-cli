import type { DirSource, FileKind, FileMetadata, FileSource, SourcePart } from './source.js'
import { getFileName } from './utils.js'

export interface FileSystem {
  fsId: string
  canParse: (sourceId: string) => boolean
  getKind: (sourceId: string) => FileKind
  getFileName: (sourceId: string) => string
  getPrefix: (sourceId: string) => string
  getResolveUrl: (sourceId: string) => string
  getSourceParts: (sourceId: string) => SourcePart[]
  listFiles: (prefix: string) => Promise<FileMetadata[]>
  getSource?: (sourceId: string) => FileSource | DirSource
}

export function getSource(sourceId: string, fs: FileSystem): FileSource | DirSource | undefined {
  if (fs.getSource) {
    /// if the file system provides an optimized getSource method, use it
    return fs.getSource(sourceId)
  }
  if (!fs.canParse(sourceId)) {
    return undefined
  }
  const sourceParts = fs.getSourceParts(sourceId)
  if (fs.getKind(sourceId) === 'file') {
    return {
      kind: 'file',
      sourceId,
      sourceParts,
      fileName: fs.getFileName(sourceId),
      resolveUrl: fs.getResolveUrl(sourceId),
    }
  } else {
    const prefix = fs.getPrefix(sourceId)
    return {
      kind: 'directory',
      sourceId,
      sourceParts,
      prefix,
      listFiles: () => fs.listFiles(prefix),
    }
  }
}

function notImplemented(): never {
  throw new Error('Not implemented')
}

// Built-in implementations
export function createHttpFileSystem(): FileSystem {
  return {
    fsId: 'http' as const,
    canParse: sourceId => URL.canParse(sourceId),
    getKind: () => 'file', /// all the URLs are considered files
    getFileName,
    getPrefix: notImplemented,
    getResolveUrl: sourceId => sourceId,
    getSourceParts: sourceId => [{ text: sourceId, sourceId }],
    listFiles: notImplemented,
  }
}

export interface HyperparamFileMetadata {
  key: string
  eTag?: string
  fileSize?: number
  lastModified: string
}
async function fetchHyperparamFilesList(prefix: string, endpoint: string): Promise<HyperparamFileMetadata[]> {
  const url = new URL('/api/store/list', endpoint)
  url.searchParams.append('prefix', prefix)
  const res = await fetch(url)
  if (res.ok) {
    return await res.json() as HyperparamFileMetadata[]
  } else {
    throw new Error(await res.text())
  }
}
export function createHyperparamFileSystem({ endpoint }: {endpoint: string}): FileSystem {
  if (!URL.canParse(endpoint)) {
    throw new Error('Invalid endpoint')
  }
  function getKind(sourceId: string): FileKind {
    return sourceId === '' || sourceId.endsWith('/') ? 'directory' : 'file'
  }
  return {
    fsId: 'hyperparam' as const,
    canParse: (sourceId: string): boolean => {
      /// we expect relative paths, such as path/to/file or path/to/dir/
      /// let's just check that it is empty or starts with a "word" character
      return sourceId === '' || /^[\w]/.test(sourceId)
    },
    getKind,
    getFileName,
    getPrefix: sourceId => sourceId.replace(/\/$/, ''),
    getResolveUrl: (sourceId: string): string => {
      const url = new URL('/api/store/get', endpoint)
      url.searchParams.append('key', sourceId)
      return url.toString()
    },
    getSourceParts: (sourceId: string): SourcePart[] => {
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
    },
    listFiles: async (prefix: string): Promise<FileMetadata[]> => {
      const files = await fetchHyperparamFilesList(prefix, endpoint)
      return files.map(file => ({
        name: file.key,
        eTag: file.eTag,
        size: file.fileSize,
        lastModified: file.lastModified,
        sourceId: (prefix === '' ? '' : prefix + '/') + file.key,
        kind: getKind(file.key),
      }))
    },
  }
}
