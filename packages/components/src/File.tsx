import { FileKey, UrlKey } from '@hyparam/utils'
import { useState } from 'react'
import Breadcrumb from './Breadcrumb.js'
import Layout from './Layout.js'
import Viewer from './Viewer.js'

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
