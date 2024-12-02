import { HttpFileSystem, HyperparamFileSystem, Page } from '@hyparam/components'
import React from 'react'

const fileSystems = [
  new HttpFileSystem(),
  new HyperparamFileSystem({ endpoint: location.origin }),
]

export default function App() {
  const search = new URLSearchParams(location.search)
  const url = search.get('key') ?? ""
  const row = search.get('row') === null ? undefined: Number(search.get('row'))
  const col = search.get('col') === null ? undefined: Number(search.get('col'))

  let source = undefined
  debugger
  for (const fileSystem of fileSystems) {
    const fsSource = fileSystem.getSource(url)
    if (fsSource) {
      source = fsSource
      break
    }
  }

  if (!source) {
    return React.createElement('div', { children: `Could not load a data source. You have to pass a valid source in the url.` })
  }
  return React.createElement(Page, {
    source,
    navigation: { row, col },
    config: {
      slidePanel: { minWidth: 250, maxWidth: 750 },
      routes: {
        getSourceRouteUrl: ({ source }) => `/files?key=${source}`,
        getCellRouteUrl: ({ source, col, row }) => `/files?key=${source}&col=${col}&row=${row}`,
      },
    }
  })
}

