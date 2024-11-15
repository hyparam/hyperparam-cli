import { parseKey } from '@hyparam/utils'
import Cell from './Cell.js'
import File from './File.js'
import Folder from './Folder.js'

export default function Page() {
  const search = new URLSearchParams(location.search)
  const key = search.get('key')
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