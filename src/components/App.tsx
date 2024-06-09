import React from 'react'
import Cell from './Cell.js'
import File from './File.js'
import Folder from './Folder.js'

export default function App() {
  const search = new URLSearchParams(location.search)
  if (!search.has('key') || search.get('key')?.endsWith('/')) {
    // folder view
    return <Folder />
  } else if (search.has('row') && search.has('col')) {
    // cell view
    return <Cell />
  } else {
    // file view
    return <File />
  }
}
