import { parseKey } from '../lib/key.ts'
import Cell from './Cell.tsx'
import File from './File.tsx'
import Folder from './Folder.tsx'

export default function Page() {
  const search = new URLSearchParams(location.search)
  const key = decodeURIComponent(search.get('key') || '')
  if (Array.isArray(key)) throw new Error('key must be a string')

  const parsedKey = parseKey(key)

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
    return <File parsedKey={parsedKey} />
  }
}
