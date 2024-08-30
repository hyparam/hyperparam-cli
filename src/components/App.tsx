import React from 'react'
import Cell from './Cell.js'
import File from './File.js'
import Folder from './Folder.js'

export default function App() {
  const search = new URLSearchParams(location.search)
  const key = search.get('key') || ''
  if (Array.isArray(key)) throw new Error('key must be a string')

  if (!key || key.endsWith('/')) {
    // folder view
    const prefix = key.replace(/\/$/, '')
    return <Folder prefix={prefix} />
  } else if (search.has('col') && search.has('row')) {
    // cell view
    return <Cell />
  } else {
    // file view
    return <File file={key} />
  }
}
