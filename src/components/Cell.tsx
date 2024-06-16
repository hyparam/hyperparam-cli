import { stringify } from 'hightable'
import React, { useEffect, useState } from 'react'
import MonacoEditor from 'react-monaco-editor'
import { parquetDataFrame } from '../tableProvider.js'
import Layout from './Layout.js'

enum LoadingState {
  NotLoaded,
  Loading,
  Loaded
}

const editorOptions = {
  automaticLayout: true,
  colorDecorators: true,
  contextmenu: false,
  language: 'javascript',
  readOnly: true,
  selectOnLineNumbers: true,
}

/**
 * Cell viewer displays a single cell from a table.
 */
export default function CellView() {
  const [loading, setLoading] = useState<LoadingState>(LoadingState.NotLoaded)
  const [text, setText] = useState<string | undefined>()
  const [progress, setProgress] = useState<number>()
  const [error, setError] = useState<Error>()

  // File path from url
  const search = new URLSearchParams(location.search)
  const key = decodeURIComponent(search.get('key') || '')
  const path = key.split('/')
  const shortKey = path.at(-1)
  const isUrl = key.startsWith('http://') || key.startsWith('https://')
  const url = isUrl ? key : '/api/store/get?key=' + key

  // row, col from url
  const row = Number(search.get('row'))
  const col = Number(search.get('col'))

  // Load cell data
  useEffect(() => {
    async function loadCellData() {
      try {
        // TODO: handle first row > 100kb
        setProgress(0.33)
        const df = await parquetDataFrame(url)
        setProgress(0.66)
        const rows = await df.rows(row, row + 1)
        const cell = rows[0][col]
        setText(stringify(cell))
      } catch (error) {
        setError(error as Error)
      } finally {
        setLoading(LoadingState.Loaded)
        setProgress(undefined)
      }
    }

    if (loading === LoadingState.NotLoaded) {
      // use loading state to ensure we only load content once
      setLoading(LoadingState.Loading)
      loadCellData()
    }
  }, [col, row, loading, setError])

  return <Layout progress={progress} error={error} title={shortKey}>
    <nav className='top-header'>
      <div className='path'>
        {isUrl &&
          <a href={`/files?key=${key}`}>{key}</a>
        }
        {!isUrl && <>
          <a href='/files'>/</a>
          {key && key.split('/').slice(0, -1).map((sub, depth) =>
            <a href={`/files?key=${path.slice(0, depth + 1).join('/')}/`} key={depth}>{sub}/</a>
          )}
          <a href={`/files?key=${key}`}>{path.at(-1)}</a>
        </>}
      </div>
    </nav>

    {/* @ts-expect-error MonocoEditor type is wrong? */
      <MonacoEditor
        className='code'
        height="100vh"
        options={editorOptions}
        theme='vs-dark'
        value={text}
        width="100%" />
    }
  </Layout>
}
