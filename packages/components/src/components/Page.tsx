import { parseKey } from '../lib/key.js'
import Cell from './Cell.js'
import File, { FileConfig } from './File.js'
import Folder from './Folder.js'

export type PageConfig = FileConfig

interface PageProps {
  apiBaseUrl: string
  config?: PageConfig
}

export default function Page({ apiBaseUrl, config }: PageProps) {
  const search = new URLSearchParams(location.search)
  const key = search.get('key')
  if (Array.isArray(key)) throw new Error('key must be a string')

  const parsedKey = parseKey(key, { apiBaseUrl } )

  // row, col from url
  const row = search.get('row')
  const col = search.get('col')

  if (parsedKey.kind === 'folder') {
    return <Folder folderKey={parsedKey} />
  } else if (row !== null && col !== null) {
    // cell view
    return <Cell parsedKey={parsedKey} row={Number(row)} col={Number(col)} />
  } else {
    // file view
    return <File parsedKey={parsedKey} config={config} />
  }
}
