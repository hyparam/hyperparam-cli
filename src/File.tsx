import HighTable, { DataFrame } from 'hightable'
import React, { useEffect, useState } from 'react'
import type { FileContent } from './files.js'
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
  const prefix = decodeURI(path.slice(2).join('/'))

  // Filename loaded immediately from url, file contents loaded async
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState<FileContent<void>>()

  useEffect(() => {
    parquetDataFrame('/api/store/get?key=' + prefix)
      .then(setDataframe)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  return (
    <Layout error={error} title={prefix}>
      <nav className='top-header'>
        <div className='path'>
          <a href='/files'>/</a>
          {prefix && prefix.split('/').map((sub, depth) =>
            <a href={'/files/' + path.slice(2, depth + 3).join('/')} key={depth}>{sub}/</a>
          )}
        </div>
      </nav>

      {dataframe && <HighTable data={dataframe} />}

      {loading && <Spinner className='center' />}
    </Layout>
  )
}
