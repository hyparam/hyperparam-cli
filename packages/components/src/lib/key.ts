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
  prefix: string;
}

export type ParsedKey = FileKey | UrlKey | FolderKey;

export function parseKey(raw: string | null): ParsedKey {
  if (!raw) {
    return { kind: 'folder', raw, prefix: '' }
  }
  const key = decodeURIComponent(raw)
  if (key.endsWith('/')) {
    const prefix = key.replace(/\/$/, '')
    return { kind: 'folder', raw, prefix }
  }

  const fileName = key
    .replace(/\?.*$/, '') // remove query string
    .split('/')
    .at(-1)
  if (!fileName) throw new Error('Invalid key')

  if (key.startsWith('http://') || key.startsWith('https://')) {
    return { kind: 'url', raw, resolveUrl: key, fileName }
  }
  const resolveUrl = '/api/store/get?key=' + key
  return { kind: 'file', raw, resolveUrl, fileName }
}
