import React from 'react'
import ReactDOM from 'react-dom'
import Cell from './components/Cell.js'
import File from './components/File.js'
import Folder from './components/Folder.js'

function render() {
  const app = document.getElementById('app')
  if (!app) throw new Error('missing app element')

  // @ts-expect-error TODO: fix react createRoot type
  const root = ReactDOM.createRoot(app)
  const search = new URLSearchParams(location.search)
  if (!search.has('key') || search.get('key')?.endsWith('/')) {
    // folder view
    root.render(React.createElement(Folder))
  } else if (search.has('row') && search.has('col')) {
    // cell view
    root.render(React.createElement(Cell))
  } else {
    // file view
    root.render(React.createElement(File))
  }
}
render()
