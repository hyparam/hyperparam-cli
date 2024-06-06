import React from 'react'
import ReactDOM from 'react-dom'
import Cell from './Cell.js'
import File from './File.js'
import Folder from './Folder.js'

function render() {
  const app = document.getElementById('app')
  if (!app) throw new Error('missing app element')

  // @ts-expect-error TODO: fix react createRoot type
  const root = ReactDOM.createRoot(app)
  if (location.pathname.endsWith('/')) {
    // Render folder view
    root.render(React.createElement(Folder))
  } else if (location.search) {
    // Render cell view
    root.render(React.createElement(Cell))
  } else {
    // Render file view
    root.render(React.createElement(File))
  }

}
render()
