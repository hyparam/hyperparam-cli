import HighTable, { DataFrame } from 'hightable'
import React, { useState } from 'react'
import type { FileContent } from './files.js'
import Layout, { Spinner } from './Layout.js'

/**
 * File viewer page
 */
export default function File() {
  const [error, setError] = useState<Error>()

  // File path from url
  const path = location.pathname.split('/')
  const prefix = decodeURI(path.slice(2).join('/'))

  // Filename loaded immediately from url, file contents loaded async
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState<FileContent<void>>()

  const header = ['ID', 'Name', 'Age', 'UUID', 'JSON']
  const dataframe: DataFrame = {
    header,
    numRows: 10000,
    async rows(start: number, end: number) {
      const arr = []
      for (let i = start; i < end; i++) {
        const uuid = Math.random().toString(16).substring(2)
        const row = [i + 1, 'Name' + i, 20 + i, uuid]
        const object = Object.fromEntries(header.map((key, index) => [key, row[index]]))
        arr.push([...row, object])
      }
      return arr
    },
  }

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

      <HighTable data={dataframe} />

      {loading && <Spinner className='center' />}
    </Layout>
  )
}
