import { DirSource, FileMetadata, FileSource, SourcePart } from './types.js'
import { getFileName } from './utils.js'

function s3listv2(bucket: string, prefix: string) {
  const url = `https://${bucket}.s3.amazonaws.com/?list-type=2&prefix=${prefix}&delimiter=/`
  return fetch(url)
    .then(res => {
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
      return res.text()
    })
    .then(text => {
      const results = []

      // Parse regular objects (files and explicit directories)
      const contentsRegex = /<Contents>(.*?)<\/Contents>/gs
      const contentsMatches = text.match(contentsRegex) ?? []

      for (const match of contentsMatches) {
        const keyMatch = /<Key>(.*?)<\/Key>/.exec(match)
        const lastModifiedMatch = /<LastModified>(.*?)<\/LastModified>/.exec(match)
        const sizeMatch = /<Size>(.*?)<\/Size>/.exec(match)
        const eTagMatch = /<ETag>&quot;(.*?)&quot;<\/ETag>/.exec(match) ?? /<ETag>"(.*?)"<\/ETag>/.exec(match)

        if (!keyMatch || !lastModifiedMatch) continue

        const key = keyMatch[1]
        const lastModified = lastModifiedMatch[1]
        const size = sizeMatch ? parseInt(sizeMatch[1], 10) : undefined
        const eTag = eTagMatch ? eTagMatch[1] : undefined

        results.push({ key, lastModified, size, eTag })
      }

      // Parse CommonPrefixes (virtual directories)
      const prefixRegex = /<CommonPrefixes>(.*?)<\/CommonPrefixes>/gs
      const prefixMatches = text.match(prefixRegex) ?? []

      for (const match of prefixMatches) {
        const prefixMatch = /<Prefix>(.*?)<\/Prefix>/.exec(match)
        if (!prefixMatch) continue

        const key = prefixMatch[1]
        results.push({
          key,
          lastModified: new Date().toISOString(), // No lastModified for CommonPrefixes
          size: 0,
          isCommonPrefix: true,
        })
      }

      return results
    })
}

function getS3SourceParts(sourceId: string): SourcePart[] {
  const [protocol, rest] = sourceId.split('://', 2)
  const parts = rest
    ? [`${protocol}://${rest.split('/', 1)[0]}`, ...rest.split('/').slice(1)]
    : sourceId.split('/')
  const sourceParts = [
    ...parts.map((part, depth) => {
      const slashSuffix = depth === parts.length - 1 ? '' : '/'
      return {
        text: part + slashSuffix,
        sourceId: parts.slice(0, depth + 1).join('/') + slashSuffix,
      }
    }),
  ]
  if (sourceParts[sourceParts.length - 1]?.text === '') {
    sourceParts.pop()
  }
  return sourceParts
}

export function getHttpSource(sourceId: string, options?: {requestInit?: RequestInit}): FileSource | DirSource | undefined {
  if (!URL.canParse(sourceId)) {
    return undefined
  }

  const sourceParts = getS3SourceParts(sourceId)

  if (sourceId.endsWith('/')) {
    const url = new URL(sourceId)
    const bucket = url.hostname.split('.')[0]
    const prefix = url.pathname.slice(1)

    if (!bucket) {
      return undefined
    }

    return {
      kind: 'directory',
      sourceId,
      sourceParts,
      prefix,
      listFiles: () => s3listv2(bucket, prefix).then(items =>
        items
          .filter(item => Boolean(item.key))
          .map(item => {
            if (!item.key) return undefined
            const isDirectory = item.key.endsWith('/')
            const itemSourceId = `https://${bucket}.s3.amazonaws.com/${item.key}`
            let name = item.key.split('/').pop() ?? item.key
            if (name && isDirectory) {
              name = name.replace(prefix, '')
            }
            return {
              name,
              lastModified: item.lastModified,
              sourceId: itemSourceId,
              kind: isDirectory ? 'directory' : 'file',
            } as FileMetadata
          })
      ),
    } as DirSource
  }

  return {
    kind: 'file',
    sourceId,
    sourceParts,
    fileName: getFileName(sourceId),
    resolveUrl: sourceId,
    requestInit: options?.requestInit,
  }
}
