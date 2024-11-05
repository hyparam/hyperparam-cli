import { useState } from 'react'
import Layout from './Layout.tsx'
import Viewer from './Viewer.tsx'
import Breadcrumb from './Breadcrumb.tsx'
import {UrlKey, FileKey} from '../lib/key.ts'

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
