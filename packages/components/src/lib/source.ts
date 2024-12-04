import type { FileMetadata, FileSystem, SourcePart } from './filesystem.js'

interface BaseSource {
  source: string
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

export function getSource(source: string, fs: FileSystem): FileSource | DirSource | undefined {
  try {
    if (!fs.canParse(source)) {
      return
    }
    const sourceParts = fs.getSourceParts(source)
    if (fs.getKind(source) === 'file') {
      return {
        kind: 'file',
        source,
        sourceParts,
        fileName: fs.getFileName(source),
        resolveUrl: fs.getResolveUrl(source),
      }
    } else {
      const prefix = fs.getPrefix(source)
      return {
        kind: 'directory',
        source,
        sourceParts,
        prefix,
        listFiles: () => fs.listFiles(prefix),
      }
    }
  } catch {
    console.debug('Failed to get source', source)
  }
}
