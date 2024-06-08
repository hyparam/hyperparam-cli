import HighTable, { DataFrame } from 'hightable'
import React, { useEffect, useState } from 'react'
import { parquetDataFrame } from '../tableProvider.js'
import Layout, { Spinner } from './Layout.js'

/**
 * File viewer page
 */
export default function File() {
  const [error, setError] = useState<Error>()
  const [dataframe, setDataframe] = useState<DataFrame>()

  // File path from url
  const search = new URLSearchParams(location.search)
  const key = decodeURIComponent(search.get('key') || '').replace(/\/$/, '')
  const path = key.split('/')

  const isUrl = key.startsWith('http://') || key.startsWith('https://')
  const url = isUrl ? key : '/api/store/get?key=' + key

  // Filename loaded immediately from url, file contents loaded async
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    parquetDataFrame(url)
      .then(setDataframe)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  function onDoubleClickCell(row: number, col: number) {
    location.href = '/files?key=' + key + '&row=' + row + '&col=' + col
  }

  return <Layout error={error} title={key}>
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

    {dataframe &&
      <HighTable data={dataframe} onDoubleClickCell={onDoubleClickCell} />
    }

    {loading && <Spinner className='center' />}
  </Layout>
}
