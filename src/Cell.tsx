import MonacoEditor from '@monaco-editor/react'
import { stringify } from 'hightable'
import React, { useEffect, useState } from 'react'
import Layout from './Layout.js'
import { parquetDataFrame } from './tableProvider.js'

enum LoadingState {
  NotLoaded,
  Loading,
  Loaded
}

const editorOptions = {
  colorDecorators: true,
  contextmenu: false,
  selectOnLineNumbers: true,
  readOnly: true,
  language: 'javascript',
  automaticLayout: true,
}

/**
 * Cell viewer displays a single cell from a table.
 */
export default function CellView(): JSX.Element {
  const [loading, setLoading] = useState<LoadingState>(LoadingState.NotLoaded)
  const [text, setText] = useState<string | undefined>()
  const [error, setError] = useState<Error>()

  // File path from url
  const path = location.pathname.split('/')
  const key = decodeURI(path.slice(2).join('/'))

  // row, col from url
  const search = new URLSearchParams(location.search)
  const row = Number(search.get('row'))
  const col = Number(search.get('col'))

  // Load cell data
  useEffect(() => {
    async function loadCellData() {
      try {
        // TODO: handle first row > 100kb
        const df = await parquetDataFrame(`/api/store/get?key=${key}`)
        const rows = await df.rows(row, row + 1)
        const cell = rows[0][col]
        setText(stringify(cell))
      } catch (error) {
        setError(error as Error)
      } finally {
        setLoading(LoadingState.Loaded)
      }
    }

    setLoading(loading => {
      // use loading state to ensure we only load content once
      if (loading !== LoadingState.NotLoaded) return loading
      loadCellData()
      return LoadingState.Loading
    })
  }, [col, row, loading, setError])

  return <Layout error={error} title={key}>
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
