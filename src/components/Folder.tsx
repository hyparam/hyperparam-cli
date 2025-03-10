import { useEffect, useRef, useState } from 'react'
import type { DirSource, FileMetadata } from '../lib/sources/types.js'
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
  const [searchQuery, setSearchQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  // Fetch files on component mount
  useEffect(() => {
    source.listFiles()
      .then(setFiles)
      .catch((error: unknown) => {
        setFiles([])
        setError(error instanceof Error ? error : new Error(`Failed to fetch files - ${error}`))
      })
  }, [source])

  // File search
  const filtered = files?.filter(file => file.name.toLowerCase().includes(searchQuery.toLowerCase()))
  useEffect(() => {
    const searchElement = searchRef.current
    function handleKeyup(e: KeyboardEvent) {
      const searchQuery = searchRef.current?.value ?? ''
      setSearchQuery(searchQuery)
      if (e.key === 'Escape') {
        // clear search
        if (searchRef.current) {
          searchRef.current.value = ''
        }
        setSearchQuery('')
      } else if (e.key === 'Enter') {
        // if there is only one result, view it
        if (filtered?.length === 1) {
          const key = join(source.prefix, filtered[0].name)
          if (key.endsWith('/')) {
            // clear search because we're about to change folder
            if (searchRef.current) {
              searchRef.current.value = ''
            }
            setSearchQuery('')
          }
          location.href = `/files?key=${key}`
        }
      } else if (e.key === 'ArrowDown') {
        // move focus to first list item
        listRef.current?.querySelector('a')?.focus()
      }
    }
    searchElement?.addEventListener('keyup', handleKeyup)
    // Clean up event listener
    return () => searchElement?.removeEventListener('keyup', handleKeyup)
  }, [filtered, source.prefix])

  // Jump to search box if user types '/'
  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if (e.key === '/' && e.target === document.body) {
        e.preventDefault()
        searchRef.current?.focus()
        // select all text
        searchRef.current?.setSelectionRange(0, searchRef.current.value.length)
      }
    }
    document.addEventListener('keydown', handleKeydown)
    return () => { document.removeEventListener('keydown', handleKeydown) }
  }, [])

  return <Layout error={error} title={source.prefix}>
    <Breadcrumb source={source} config={config}>
      <div className='top-actions'>
        <input autoFocus className='search' placeholder='Search...' ref={searchRef} />
      </div>
    </Breadcrumb>

    {files && files.length > 0 && <ul className='file-list' ref={listRef}>
      {filtered?.map((file, index) =>
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
        </li>
      )}
    </ul>}
    {files?.length === 0 && <div className='center'>No files</div>}
    {files === undefined && <div className='center'><Spinner /></div>}
  </Layout>
}

function join(prefix: string, file: string) {
  return prefix ? prefix + '/' + file : file
}
