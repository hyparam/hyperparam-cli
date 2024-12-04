import { getFileName } from './utils.js'

export type FileKind = 'file' | 'directory'

export interface FileMetadata {
  name: string
  eTag?: string
  size?: number
  lastModified?: string
  source: string
  kind: FileKind
}

export interface SourcePart {
  name: string
  source: string
}

export interface FileSystem {
  fsId: string
  canParse: (source: string) => boolean
  getKind: (source: string) => FileKind
  getFileName: (source: string) => string
  getPrefix: (source: string) => string
  getResolveUrl: (source: string) => string
  getSourceParts: (source: string) => SourcePart[]
  listFiles: (prefix: string) => Promise<FileMetadata[]>
}

function notImplemented(): never {
  throw new Error('Not implemented')
}

// Built-in implementations
export function createHttpFileSystem(): FileSystem {
  return {
    fsId: 'http' as const,
    canParse: source => URL.canParse(source),
    getKind: () => 'file', /// all the URLs are considered files
    getFileName,
    getPrefix: notImplemented,
    getResolveUrl: source => source,
    getSourceParts: source => [{ name: source, source }],
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
  function getKind(source: string): FileKind {
    return source === '' || source.endsWith('/') ? 'directory' : 'file'
  }
  return {
    fsId: 'hyperparam' as const,
    canParse: (source: string): boolean => {
      /// we expect relative paths, such as path/to/file or path/to/dir/
      /// let's just check that it is empty or starts with a "word" character
      return source === '' || /^[\w]/.test(source)
    },
    getKind,
    getFileName,
    getPrefix: source => source.replace(/\/$/, ''),
    getResolveUrl: (source: string): string => {
      const url = new URL('/api/store/get', endpoint)
      url.searchParams.append('key', source)
      return url.toString()
    },
    getSourceParts: (source: string): SourcePart[] => {
      const parts = source.split('/')
      return [
        { 'name': '/', 'source': '' },
        ...parts.map((part, depth) => {
          const slashSuffix = depth === parts.length - 1 ? '' : '/'
          return {
            name: part + slashSuffix,
            source: parts.slice(0, depth + 1).join('/') + slashSuffix,
          }
        }),
      ]
    },
    async listFiles(prefix: string): Promise<FileMetadata[]> {
      const files = await fetchHyperparamFilesList(prefix, endpoint)
      return files.map(file => ({
        name: file.key,
        eTag: file.eTag,
        size: file.fileSize,
        lastModified: file.lastModified,
        source: (prefix === '' ? '' : prefix + '/') + file.key,
        kind: getKind(file.key),
      }))
    },
  }
}
