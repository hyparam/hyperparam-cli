import React from 'react'
import ReactDOM from 'react-dom'
import Cell from './Cell.js'
import File from './File.js'
import Folder from './Folder.js'
import Url from './Url.js'

function render() {
  const app = document.getElementById('app')
  if (!app) throw new Error('missing app element')
  console.log('rendering', location.pathname)

  // @ts-expect-error TODO: fix react createRoot type
  const root = ReactDOM.createRoot(app)
  if (location.pathname.endsWith('/')) {
    // Render folder view
    root.render(React.createElement(Folder))
  } else if (location.pathname.startsWith('/url/')) {
    // Render url view
    root.render(React.createElement(Url))
  } else if (location.search) {
    // Render cell view
    root.render(React.createElement(Cell))
  } else {
    // Render file view
    root.render(React.createElement(File))
  }

}
render()
