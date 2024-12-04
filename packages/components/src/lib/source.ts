import type { FileMetadata, FileSystem, SourcePart } from './filesystem.js'

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

export function getSource(sourceId: string, fs: FileSystem): FileSource | DirSource | undefined {
  try {
    if (!fs.canParse(sourceId)) {
      return
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
  } catch {
    console.debug('Failed to get source', sourceId)
  }
}
