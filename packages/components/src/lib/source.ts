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

interface BaseSource {
  source: string
  getSourceParts: () => SourcePart[]
}

export interface FileSource extends BaseSource {
  kind: 'file'
  fileName: string
  resolveUrl: string
}

export interface DirSource extends BaseSource {
  kind: 'directory'
  prefix: string,
  listFiles: () => Promise<FileMetadata[]>
}

export type Source = FileSource | DirSource
