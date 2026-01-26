import { useEffect, useMemo, useRef, useState } from 'react'
import { useConfig } from '../../hooks/useConfig.js'
import type { DirSource, FileMetadata } from '../../lib/sources/types.js'
import { cn, formatFileSize, getFileDate, getFileDateShort } from '../../lib/utils.js'
import Breadcrumb from '../Breadcrumb/Breadcrumb.js'
import Center from '../Center/Center.js'
import Dropdown from '../Dropdown/Dropdown.js'
import Layout from '../Layout/Layout.js'
import Spinner from '../Spinner/Spinner.js'
import styles from './Folder.module.css'

const gearIcon = <svg fill='white' height='20' viewBox='0 0 24 24' width='20' xmlns='http://www.w3.org/2000/svg'>
  <path d='M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z' />
</svg>

interface FolderProps {
  source: DirSource
}

/**
 * Folder browser page
 */
export default function Folder({ source }: FolderProps) {
  // State to hold file listing
  const [files, setFiles] = useState<FileMetadata[]>()
  const [error, setError] = useState<Error>()
  const [searchQuery, setSearchQuery] = useState('')
  const [showHiddenFiles, setShowHiddenFiles] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const { routes, customClass } = useConfig()

  // Fetch files on component mount
  useEffect(() => {
    source.listFiles()
      .then(setFiles)
      .catch((error: unknown) => {
        setFiles([])
        setError(error instanceof Error ? error : new Error(`Failed to fetch files - ${error}`))
      })
  }, [source])

  // File search and hidden files filtering
  const filtered = useMemo(() => {
    return files?.filter(file => {
      const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase())
      const isHidden = file.name.startsWith('.')
      return matchesSearch && (showHiddenFiles || !isHidden)
    })
  }, [files, searchQuery, showHiddenFiles])

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
        if (filtered?.length === 1 && 0 in filtered) {
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
    <Breadcrumb source={source}>
      <input autoFocus className={cn(styles.search, customClass?.search)} placeholder='Search...' ref={searchRef} />
      <Dropdown className={styles.settings} label={gearIcon} align='right'>
        <button onClick={() => { setShowHiddenFiles(!showHiddenFiles) }}>
          {showHiddenFiles ? 'Hide hidden files' : 'Show hidden files'}
        </button>
      </Dropdown>
    </Breadcrumb>

    {filtered === undefined ?
      <Center><Spinner /></Center> :
      filtered.length === 0 ?
        <Center>No files</Center> :
        <ul className={cn(styles.fileList, customClass?.fileList)} ref={listRef}>
          {filtered.map((file, index) =>
            <li key={index}>
              <a href={routes?.getSourceRouteUrl?.({ sourceId: file.sourceId }) ?? location.href}>
                <span data-file-kind={file.kind}>
                  {file.name}
                </span>
                {file.kind === 'file' && <>
                  {file.fileSize !== undefined && <span data-file-size title={file.fileSize.toLocaleString() + ' bytes'}>
                    {formatFileSize(file.fileSize)}
                  </span>}
                  <span data-file-date title={getFileDate(file)}>
                    {getFileDateShort(file)}
                  </span>
                </>}
              </a>
            </li>
          )}
        </ul>
    }
  </Layout>
}

function join(prefix: string, file: string) {
  return prefix ? prefix + '/' + file : file
}
