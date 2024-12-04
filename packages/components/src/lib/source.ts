export type FileKind = 'file' | 'directory'

export interface FileMetadata {
  name: string
  eTag?: string
  size?: number
  lastModified?: string
  sourceId: string /// the source URL or path
  kind: FileKind
}

export interface SourcePart {
  text: string
  sourceId: string
}

interface BaseSource {
  sourceId: string
  sourceParts: SourcePart[]
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

