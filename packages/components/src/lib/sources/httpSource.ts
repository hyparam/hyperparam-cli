import { DirSource, FileSource } from './types.js'
import { getFileName } from './utils.js'

export function getHttpSource(sourceId: string, options?: {requestInit?: RequestInit}): FileSource | DirSource | undefined {
  if (!URL.canParse(sourceId)) {
    return undefined
  }
  return {
    kind: 'file',
    sourceId,
    sourceParts: [{ text: sourceId, sourceId }],
    fileName: getFileName(sourceId),
    resolveUrl: sourceId,
    requestInit: options?.requestInit,
  }
}
