export type FileKind = 'file' | 'directory'

export interface FileMetadata {
  name: string
  eTag?: string
  fileSize?: number
  lastModified?: string
  sourceId: string /// the source URL or path
  kind: FileKind
}

export interface SourcePart {
  text: string
  sourceId: string
}

export interface Version {
  label: string
  sourceId: string
}

export interface VersionsData {
  label: string // "version" or "branch"
  versions: Version[]
}

interface BaseSource {
  sourceId: string
  sourceParts: SourcePart[]
  fetchVersions?: () => Promise<VersionsData>
}

export interface FileSource extends BaseSource {
  kind: 'file'
  fileName: string
  resolveUrl: string
  requestInit?: RequestInit
}

export interface DirSource extends BaseSource {
  kind: 'directory'
  prefix: string,
  listFiles: () => Promise<FileMetadata[]>
}

export type Source = FileSource | DirSource
