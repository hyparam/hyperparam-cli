import { useCallback, useEffect, useRef, useState } from 'react'
import { FileMetadata, getFileDate, getFileDateShort, getFileSize, listFiles } from '../lib/files.ts'
import type { FolderKey } from '../lib/key.ts'
import { cn } from '../lib/utils.ts'
import Layout, { Spinner } from './Layout.tsx'

interface FolderProps {
  folderKey: FolderKey
}

/**
 * Folder browser page
 */
export default function Folder({ folderKey }: FolderProps) {
  // State to hold file listing
  const [files, setFiles] = useState<FileMetadata[]>()
  const [error, setError] = useState<Error>()
  const listRef = useRef<HTMLUListElement>(null)

  // Folder path from url
  const { prefix } = folderKey
  const path = prefix.split('/')

  // Fetch files on component mount
  useEffect(() => {
    listFiles(prefix)
      .then(setFiles)
      .catch((error: unknown) => {
        setFiles([])
        setError(error instanceof Error ? error : new Error(`Failed to fetch files - ${error}`))
      })
  }, [prefix])

  const fileUrl = useCallback((file: FileMetadata) => {
    return prefix ? `/files?key=${prefix}/${file.key}` : `/files?key=${file.key}`
  }, [prefix])

  return <Layout error={error} title={prefix}>
    <nav className='top-header'>
      <div className='path'>
        <a href='/files'>/</a>
        {prefix.length > 0 && prefix.split('/').map((sub, depth) =>
          <a href={`/files?key=${path.slice(0, depth + 1).join('/')}/`} key={depth}>{sub}/</a>,
        )}
      </div>
    </nav>

    {files && files.length > 0 && <ul className='file-list' ref={listRef}>
      {files.map((file, index) =>
        <li key={index}>
          <a href={fileUrl(file)}>
            <span className={cn('file-name', 'file', file.key.endsWith('/') && 'folder')}>
              {file.key}
            </span>
            {!file.key.endsWith('/') && <>
              {file.fileSize !== undefined && <span className='file-size' title={file.fileSize.toLocaleString() + ' bytes'}>
                {getFileSize(file)}
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
