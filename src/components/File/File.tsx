import { useCallback, useState } from 'react'
import type { FileSource } from '../../lib/sources/types.js'
import { toError } from '../../lib/utils.js'
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
  const [error, setError] = useState<Error | undefined>()

  const setErrorWrapper = useCallback((error: unknown) => {
    setError(toError(error))
  }, [setError])

  return <Layout progress={progress} error={error} title={source.fileName}>
    <Breadcrumb source={source} />
    <Viewer source={source} setProgress={setProgress} setError={setErrorWrapper} />
  </Layout>
}
