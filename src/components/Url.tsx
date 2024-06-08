import HighTable, { DataFrame } from 'hightable'
import React, { useEffect, useState } from 'react'
import { parquetDataFrame } from '../tableProvider.js'
import Layout, { Spinner } from './Layout.js'

/**
 * Url viewer page
 */
export default function Url() {
  const [error, setError] = useState<Error>()
  const [dataframe, setDataframe] = useState<DataFrame>()

  // File url from query string
  const path = location.pathname.split('/')
  const key = decodeURI(path.slice(2).join('/'))
  console.log('key:', key)

  if (!key?.endsWith('.parquet')) {
    return <Layout error={new Error('Invalid file type')} title={key || ''}>
      <div className='center'>Invalid file type</div>
    </Layout>
  }

  // Filename loaded immediately from url, file contents loaded async
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    parquetDataFrame(key)
      .then(setDataframe)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  function onDoubleClickCell(row: number, col: number) {
    location.href = '/url/' + key + '?row=' + row + '&col=' + col
  }

  return (
    <Layout error={error} title={key}>
      <nav className='top-header'>
        <div className='path'>
          <a href='/files'>/</a>
          {key && key.split('/').slice(0, -1).map((sub, depth) =>
            <a href={`/files/${path.slice(2, depth + 3).join('/')}/`} key={depth}>{sub}/</a>
          )}
          <a href={`/files/${key}`}>{path.at(-1)}</a>
        </div>
      </nav>

      {dataframe &&
        <HighTable data={dataframe} onDoubleClickCell={onDoubleClickCell} />
      }

      {loading && <Spinner className='center' />}
    </Layout>
  )
}
