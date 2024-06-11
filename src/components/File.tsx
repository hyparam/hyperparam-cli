import HighTable, { DataFrame } from 'hightable'
import React, { useCallback, useEffect, useState } from 'react'
import { parquetDataFrame } from '../tableProvider.js'
import Layout, { Spinner } from './Layout.js'

enum LoadingState {
  NotLoaded,
  Loading,
  Loaded
}

/**
 * File viewer page
 */
export default function File() {
  const [loading, setLoading] = useState<LoadingState>(LoadingState.NotLoaded)
  const [dataframe, setDataframe] = useState<DataFrame>()
  const [progress, setProgress] = useState<number>()
  const [error, setError] = useState<Error>()

  // File path from url
  const search = new URLSearchParams(location.search)
  const key = decodeURIComponent(search.get('key') || '')
  const path = key.split('/')
  const shortKey = path.at(-1)

  const isUrl = key.startsWith('http://') || key.startsWith('https://')
  const url = isUrl ? key : '/api/store/get?key=' + key

  useEffect(() => {
    async function loadParquetDataFrame() {
      try {
        setProgress(0.5)
        const df = await parquetDataFrame(url)
        setDataframe(df)
        setProgress(undefined)
      } catch (error) {
        setError(error as Error)
      } finally {
        setLoading(LoadingState.Loaded)
      }
    }
    if (loading === LoadingState.NotLoaded) {
      setLoading(LoadingState.Loading)
      loadParquetDataFrame()
    }
  }, [])

  const onDoubleClickCell = useCallback((row: number, col: number) => {
    location.href = '/files?key=' + key + '&row=' + row + '&col=' + col
  }, [key])

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

    {dataframe && <HighTable
      data={dataframe}
      onDoubleClickCell={onDoubleClickCell}
      onError={setError} />}

    {loading && <Spinner className='center' />}
  </Layout>
}
