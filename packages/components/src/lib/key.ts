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
  raw: string;
  prefix: string;
}

export type ParsedKey = FileKey | UrlKey | FolderKey;

export function parseKey(key: string): ParsedKey {
  if (key === '' || key.endsWith('/')) {
    const prefix = key.replace(/\/$/, '')
    return { kind: 'folder', raw: key, prefix }
  }

  const fileName = key
    .replace(/\?.*$/, '') // remove query string
    .split('/')
    .at(-1)
  if (!fileName) throw new Error('Invalid key')

  if (key.startsWith('http://') || key.startsWith('https://')) {
    return { kind: 'url', raw: key, resolveUrl: key, fileName }
  }
  const resolveUrl = '/api/store/get?key=' + key
  return { kind: 'file', raw: key, resolveUrl, fileName }
}
