import React, { useEffect, useRef, useState } from 'react'
import {
  FileMetadata, getFileDate, getFileDateShort, getFileSize, listFiles,
} from '../files.js'
import Layout, { Spinner, cn } from './Layout.js'

/**
 * Folder browser page
 */
export default function Folder() {
  // State to hold file listing
  const [files, setFiles] = useState<FileMetadata[]>()
  const [error, setError] = useState<Error>()
  const listRef = useRef<HTMLUListElement>(null)

  // Folder path from url
  const search = new URLSearchParams(location.search)
  const key = (search.get('key') || '').replace(/\/$/, '')
  const path = key.split('/')

  // Fetch files on component mount
  useEffect(() => {
    listFiles(key)
      .then(setFiles)
      .catch(error => {
        setFiles([])
        setError(error)
      })
  }, [key])

  function fileUrl(file: FileMetadata): string {
    return key ? `/files?key=${key}/${file.key}` : `/files?key=${file.key}`
  }

  return <Layout error={error} title={key}>
    <nav className='top-header'>
      <div className='path'>
        <a href='/files'>/</a>
        {key && key.split('/').map((sub, depth) =>
          <a href={`/files?key=${path.slice(0, depth + 1).join('/')}/`} key={depth}>{sub}/</a>
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
              <span className='file-size' title={file.fileSize?.toLocaleString() + ' bytes'}>
                {getFileSize(file)}
              </span>
              <span className='file-date' title={getFileDate(file)}>
                {getFileDateShort(file)}
              </span>
            </>}
          </a>
        </li>
      )}
    </ul>}
    {files?.length === 0 && <div className='center'>No files</div>}
    {files === undefined && <Spinner className='center' />}
  </Layout>
}
