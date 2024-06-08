import React from 'react'
import ReactDOM from 'react-dom'
import Cell from './components/Cell.js'
import File from './components/File.js'
import Folder from './components/Folder.js'
import Url from './components/Url.js'

function render() {
  const app = document.getElementById('app')
  if (!app) throw new Error('missing app element')
  console.log('rendering', location.pathname)

  // @ts-expect-error TODO: fix react createRoot type
  const root = ReactDOM.createRoot(app)
  if (location.pathname.endsWith('/')) {
    // folder view
    root.render(React.createElement(Folder))
  } else if (location.pathname.startsWith('/url/')) {
    // url view
    root.render(React.createElement(Url))
  } else if (location.search) {
    // local cell view
    root.render(React.createElement(Cell))
  } else {
    // local file view
    root.render(React.createElement(File))
  }

}
render()
