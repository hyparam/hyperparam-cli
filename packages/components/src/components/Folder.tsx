import { useEffect, useState } from 'react'
import type { FileMetadata } from '../lib/filesystem.js'
import type { DirSource } from '../lib/source.js'
import { cn, formatFileSize, getFileDate, getFileDateShort } from '../lib/utils.js'
import Breadcrumb, { BreadcrumbConfig } from './Breadcrumb.js'
import Layout, { Spinner } from './Layout.js'

export type FolderConfig = BreadcrumbConfig

interface FolderProps {
  source: DirSource
  config?: FolderConfig
}

/**
 * Folder browser page
 */
export default function Folder({ source, config }: FolderProps) {
  // State to hold file listing
  const [files, setFiles] = useState<FileMetadata[]>()
  const [error, setError] = useState<Error>()

  // Fetch files on component mount
  useEffect(() => {
    source.listFiles()
      .then(setFiles)
      .catch((error: unknown) => {
        setFiles([])
        setError(error instanceof Error ? error : new Error(`Failed to fetch files - ${error}`))
      })
  }, [source])

  return <Layout error={error} title={source.prefix}>
    <Breadcrumb source={source} config={config} />

    {files && files.length > 0 && <ul className='file-list'>
      {files.map((file, index) =>
        <li key={index}>
          <a href={config?.routes?.getSourceRouteUrl?.({ sourceId: file.sourceId }) ?? location.href}>
            <span className={cn('file-name', 'file', file.kind === 'directory' && 'folder')}>
              {file.name}
            </span>
            {file.kind === 'file' && <>
              {file.size !== undefined && <span className='file-size' title={file.size.toLocaleString() + ' bytes'}>
                {formatFileSize(file.size)}
              </span>}
              <span className='file-date' title={getFileDate(file)}>
                {getFileDateShort(file)}
              </span>
            </>}
          </a>
        </li>,
      )}
    </ul>}
    {files?.length === 0 && <div className='center'>No files</div>}
    {files === undefined && <Spinner className='center' />}
  </Layout>
}
