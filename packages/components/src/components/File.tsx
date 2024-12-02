import { useState } from 'react'
import { FileSource } from '../lib/filesystem.js'
import Breadcrumb, { BreadcrumbConfig } from './Breadcrumb.js'
import Layout from './Layout.js'
import Viewer, { ViewerConfig } from './viewers/Viewer.js'

export type FileConfig = ViewerConfig & BreadcrumbConfig

interface FileProps {
  source: FileSource
  config?: FileConfig
}

/**
 * File viewer page
 */
export default function File({ source, config }: FileProps) {
  const [progress, setProgress] = useState<number>()
  const [error, setError] = useState<Error>()

  return <Layout progress={progress} error={error} title={source.fileName}>
    <Breadcrumb source={source} config={config} />
    <Viewer source={source} setProgress={setProgress} setError={setError} config={config} />
  </Layout>
}
