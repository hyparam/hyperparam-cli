import { useState } from 'react'
import Layout from './Layout.tsx'
import Viewer from './Viewer.tsx'
import Breadcrumb from './Breadcrumb.tsx'

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
    <Breadcrumb file={file} />
    <Viewer url={url} setProgress={setProgress} setError={setError} />
  </Layout>
}
