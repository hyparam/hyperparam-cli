import { useState } from 'react'
import { FileKey, UrlKey } from '../lib/key.ts'
import Breadcrumb from './Breadcrumb.tsx'
import Layout from './Layout.tsx'
import Viewer from './Viewer.tsx'

interface FileProps {
  parsedKey: UrlKey | FileKey
}

/**
 * File viewer page
 */
export default function File({ parsedKey }: FileProps) {
  const [progress, setProgress] = useState<number>()
  const [error, setError] = useState<Error>()

  return <Layout progress={progress} error={error} title={parsedKey.fileName}>
    <Breadcrumb parsedKey={parsedKey} />
    <Viewer parsedKey={parsedKey} setProgress={setProgress} setError={setError} />
  </Layout>
}
