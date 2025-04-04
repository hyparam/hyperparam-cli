import { useState } from 'react'
import type { FileSource } from '../../lib/sources/types.js'
import Breadcrumb from '../Breadcrumb/Breadcrumb.js'
import Layout from '../Layout/Layout.js'
import Viewer from '../Viewer/Viewer.js'

interface FileProps {
  source: FileSource
}

/**
 * File viewer page
 */
export default function File({ source }: FileProps) {
  const [progress, setProgress] = useState<number>()
  const [error, setError] = useState<Error>()

  return <Layout progress={progress} error={error} title={source.fileName}>
    <Breadcrumb source={source} />
    <Viewer source={source} setProgress={setProgress} setError={setError} />
  </Layout>
}
