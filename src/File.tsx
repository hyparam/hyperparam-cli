import HighTable, { DataFrame } from 'hightable'
import React, { useEffect, useState } from 'react'
import Layout, { Spinner } from './Layout.js'
import { parquetDataFrame } from './tableProvider.js'

/**
 * File viewer page
 */
export default function File() {
  const [error, setError] = useState<Error>()
  const [dataframe, setDataframe] = useState<DataFrame>()

  // File path from url
  const path = location.pathname.split('/')
  const key = decodeURI(path.slice(2).join('/'))

  if (!key.endsWith('.parquet')) {
    return <Layout error={new Error('Invalid file type')} title={key}>
      <div className='center'>Invalid file type</div>
    </Layout>
  }

  // Filename loaded immediately from url, file contents loaded async
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    parquetDataFrame('/api/store/get?key=' + key)
      .then(setDataframe)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  function onDoubleClickCell(row: number, col: number) {
    location.href = '/files/' + key + '?row=' + row + '&col=' + col
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
