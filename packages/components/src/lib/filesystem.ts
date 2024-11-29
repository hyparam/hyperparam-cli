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

export abstract class FileSystem {
    abstract fsId: string
    abstract canParse(source: string): boolean
    abstract getKind(source: string): FileKind
    abstract getFileName(source: string): string
    abstract getPrefix(source: string): string
    abstract getResolveUrl(source: string): string
    abstract getSourceParts(source: string): SourcePart[]
    abstract listFiles(prefix: string): Promise<FileMetadata[]>
    getSource(source: string): FileSource | DirSource | undefined {
      try {
        if (!this.canParse(source)) {
          return
        }
        if (this.getKind(source) === 'file') {
          return new FileSource(source, this)
        } else {
          return new DirSource(source, this)
        }
      } catch {
        console.debug('Failed to parse source', source)
      }
    }
}

export abstract class Source {
  abstract kind: 'file' | 'directory'
  fs: FileSystem
  source: string
  constructor(source: string, fs: FileSystem) {
    this.source = source
    this.fs = fs
    if (!this.fs.canParse(source)) {
      throw new Error('Invalid source')
    }
  }
  getSourceParts(): SourcePart[] {
    return this.fs.getSourceParts(this.source)
  }
}

export class FileSource extends Source {
  kind = 'file' as const
  fileName: string
  resolveUrl: string

  constructor(source: string, fs: FileSystem) {
    super(source, fs)
    if (this.fs.getKind(source) !== 'file') {
      throw new Error('Invalid file source')
    }
    this.resolveUrl = this.fs.getResolveUrl(source)
    this.fileName = this.fs.getFileName(source)
  }
}

export class DirSource extends Source {
  kind = 'directory' as const
  prefix: string

  constructor(source: string, fs: FileSystem) {
    super(source, fs)
    if (this.fs.getKind(source) !== 'directory') {
      throw new Error('Invalid directory source')
    }
    this.prefix = this.fs.getPrefix(source)
  }

  listFiles(): Promise<FileMetadata[]> {
    return this.fs.listFiles(this.prefix)
  }
}

// Built-in implementations

export class HttpFileSystem extends FileSystem {
  fsId = 'http' as const
  canParse(source: string): boolean {
    return URL.canParse(source)
  }
  getKind(): FileKind {
    /// all the URLs are considered files
    return 'file'
  }
  getFileName(source: string): string {
    return getFileName(source)
  }
  getPrefix(): string {
    throw new Error('Not implemented')
  }
  getResolveUrl(source: string): string {
    return source
  }
  getSourceParts(source: string): SourcePart[] {
    return [{ name: source, source }]
  }
  listFiles(): Promise<FileMetadata[]> {
    throw new Error('Not implemented')
  }
}

export interface HyparamFileMetadata {
  key: string
  eTag?: string
  fileSize?: number
  lastModified: string
}

export class HyparamFileSystem extends FileSystem {
  fsId = 'hyparam' as const
  endpoint: string
  constructor({ endpoint }: {endpoint: string}) {
    if (!URL.canParse(endpoint)) {
      throw new Error('Invalid endpoint')
    }
    super()
    this.endpoint = endpoint
  }
  canParse(source: string): boolean {
    /// we expect relative paths, such as path/to/file or path/to/dir/
    /// let's just check that it is empty or starts with a "word" character
    return source === '' || /^[\w]/.test(source)
  }
  getKind(source: string): FileKind {
    return source === '' || source.endsWith('/') ? 'directory' : 'file'
  }
  getFileName(source: string): string {
    return getFileName(source)
  }
  getPrefix(source: string): string {
    return source.replace(/\/$/, '')
  }
  getResolveUrl(source: string): string {
    const url = new URL('/api/store/get', this.endpoint)
    url.searchParams.append('key', encodeURIComponent(source))
    return url.toString()
  }
  getSourceParts(source: string): SourcePart[] {
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
  }
  async _fetchFilesList(prefix: string): Promise<HyparamFileMetadata[]> {
    const url = new URL('/api/store/list', this.endpoint)
    url.searchParams.append('prefix', encodeURIComponent(prefix))
    const res = await fetch(url)
    if (res.ok) {
      return await res.json() as HyparamFileMetadata[]
    } else {
      throw new Error(await res.text())
    }
  }
  async listFiles(prefix: string): Promise<FileMetadata[]> {
    const files = await this._fetchFilesList(prefix)
    return files.map(file => ({
      name: file.key,
      eTag: file.eTag,
      size: file.fileSize,
      lastModified: file.lastModified,
      source: file.key,
      kind: this.getKind(file.key),
    }))
  }
}




// TODO
// add tests
// select the class by looping until one of the classes can parse the URL
// pass the Url to the components

