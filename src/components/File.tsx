import React, { useState } from 'react'
import Layout from './Layout.js'
import ParquetView from './ParquetView.js'

/**
 * File viewer page
 */
export default function File() {
  const [progress, setProgress] = useState<number>()
  const [error, setError] = useState<Error>()

  // File path from url
  const search = new URLSearchParams(location.search)
  const key = decodeURIComponent(search.get('key') || '')
  const path = key.split('/')
  const shortKey = path.at(-1)

  const isUrl = key.startsWith('http://') || key.startsWith('https://')

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

    <ParquetView content={key} setProgress={setProgress} setError={setError} />
  </Layout>
}
