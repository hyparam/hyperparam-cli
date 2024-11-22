export interface FileKey {
  kind: 'file';
  raw: string;
  resolveUrl: string;
  fileName: string;
}
export interface UrlKey {
  kind: 'url';
  raw: string;
  resolveUrl: string;
  fileName: string;
}
export interface FolderKey {
  kind: 'folder';
  raw: string | null;
  listFilesUrl: string;
  prefix: string;
}

export type ParsedKey = FileKey | UrlKey | FolderKey;

function getFolderListFilesUrl(prefix: string, apiBaseUrl?: string): string {
  if (!apiBaseUrl) throw new Error('apiBaseUrl is required')
  const url = new URL( '/api/store/list', apiBaseUrl )
  url.searchParams.append('prefix', encodeURIComponent(prefix))
  return url.toString()
}

function getFileResolveUrl(key: string, apiBaseUrl?: string): string {
  if (!apiBaseUrl) throw new Error('apiBaseUrl is required')
  const url = new URL( '/api/store/get', apiBaseUrl )
  url.searchParams.append('key', encodeURIComponent(key))
  return url.toString()
}

function getFilename(key: string): string {
  const fileName = key
    .replace(/\?.*$/, '') // remove query string
    .split('/')
    .at(-1)
  if (!fileName) throw new Error('Invalid key')
  return fileName
}

export function parseKey(raw: string | null, { apiBaseUrl } : { apiBaseUrl?: string } = {}): ParsedKey {
  if (!raw) {
    const prefix = ''
    return { kind: 'folder', raw, prefix, listFilesUrl: getFolderListFilesUrl(prefix, apiBaseUrl) }
  }
  const key = decodeURIComponent(raw)
  if (key.endsWith('/')) {
    const prefix = key.replace(/\/$/, '')
    return { kind: 'folder', raw, prefix, listFilesUrl: getFolderListFilesUrl(prefix, apiBaseUrl) }
  }
  const fileName = getFilename(key)
  if (key.startsWith('http://') || key.startsWith('https://')) {
    return { kind: 'url', raw, resolveUrl: key, fileName }
  }
  return { kind: 'file', raw, fileName, resolveUrl: getFileResolveUrl(key, apiBaseUrl) }
}
