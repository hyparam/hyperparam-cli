import React from 'react'
import { Page } from '../src/index.js'

import { HttpFileSystem } from '../src/index.ts'
import { Source } from '../src/lib/filesystem.js'
export interface Navigation {
  col?: number
  row?: number
}

function getNumberParam(search: URLSearchParams, key: string): number | undefined {
  const value = search.get(key)
  if (value === null) return
  const number = Number(value)
  if (isNaN(number)) return
  return number
}

const fileSystems = [
  new HttpFileSystem(),
]

export default function App() {
  const search = new URLSearchParams(location.search)
  const url = search.get('url')
  const defaultUrl = '/?url=https://huggingface.co/datasets/severo/test-parquet/resolve/main/parquet/csv-train-00000-of-00001.parquet'
  if (!url) {
    location.href = defaultUrl
    return <div>Redirecting...</div>
  }
  // row, col from url
  const row = getNumberParam(search, 'row')
  const col = getNumberParam(search, 'col')

  let source: Source | undefined = undefined
  for (const fileSystem of fileSystems) {
    const fsSource = fileSystem.getSource(url)
    if (fsSource){
      source = fsSource
      break
    }
  }

  if (!source) {
    return <div>Could not load a data source. You have to pass a valid source in the url, eg: <a href={defaultUrl}>{defaultUrl}</a>.</div>
  }
  return <Page source={source} navigation={{ row, col }} config={{
    slidePanel: { minWidth: 250, maxWidth: 750 },
    routes: {
      getSourceRouteUrl: ({ source }) => `/?url=${source}`,
      getCellRouteUrl: ({ source, col, row }) => `/?url=${source}&col=${col}&row=${row}`,
    },
  }} />
}

