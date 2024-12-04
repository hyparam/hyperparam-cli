import { Page, createHttpFileSystem, createHyperparamFileSystem, getSource } from '@hyparam/components'
import React from 'react'

const fileSystems = [
  createHttpFileSystem(),
  createHyperparamFileSystem({ endpoint: location.origin }),
]

export default function App() {
  const search = new URLSearchParams(location.search)
  const sourceId = search.get('key') ?? ''
  const row = search.get('row') === null ? undefined : Number(search.get('row'))
  const col = search.get('col') === null ? undefined : Number(search.get('col'))

  let source = undefined
  for (const fileSystem of fileSystems) {
    const fsSource = getSource(sourceId, fileSystem)
    if (fsSource) {
      source = fsSource
      break
    }
  }

  if (!source) {
    return React.createElement('div', { children: 'Could not load a data source. You have to pass a valid source in the url.' })
  }
  return React.createElement(Page, {
    source,
    navigation: { row, col },
    config: {
      slidePanel: {},
      routes: {
        getSourceRouteUrl: ({ sourceId }) => `/files?key=${sourceId}`,
        getCellRouteUrl: ({ sourceId, col, row }) => `/files?key=${sourceId}&col=${col}&row=${row}`,
      },
    },
  })
}

