import { useState } from 'react'
import Layout from './Layout.js'
import Viewer from './Viewer.js'

interface FileProps {
  file: string
}

/**
 * File viewer page
 */
export default function File({ file }: FileProps) {
  const [progress, setProgress] = useState<number>()
  const [error, setError] = useState<Error>()

  // File path from url
  const path = file.split('/')
  const fileName = path.at(-1)
  const isUrl = file.startsWith('http://') || file.startsWith('https://')
  const url = isUrl ? file : '/api/store/get?key=' + file

  return <Layout progress={progress} error={error} title={fileName}>
    <nav className='top-header'>
      <div className='path'>
        {isUrl &&
          <a href={`/files?key=${file}`}>{file}</a>
        }
        {!isUrl && <>
          <a href='/files'>/</a>
          {file && file.split('/').slice(0, -1).map((sub, depth) =>
            <a href={`/files?key=${path.slice(0, depth + 1).join('/')}/`} key={depth}>{sub}/</a>
          )}
          <a href={`/files?key=${file}`}>{fileName}</a>
        </>}
      </div>
    </nav>

    <Viewer url={url} setProgress={setProgress} setError={setError} />
  </Layout>
}
