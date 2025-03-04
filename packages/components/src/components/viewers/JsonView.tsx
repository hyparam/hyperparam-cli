import { useEffect, useState } from 'react'
import type { FileSource } from '../../lib/sources/types.js'
import { parseFileSize } from '../../lib/utils.js'
import styles from '../../styles/Json.module.css'
import Json from '../Json.js'
import { Spinner } from '../Layout.js'
import ContentHeader, { TextContent } from './ContentHeader.js'

interface ViewerProps {
  source: FileSource
  setError: (error: Error | undefined) => void
}

const largeFileSize = 8_000_000 // 8 mb

/**
 * JSON viewer component.
 */
export default function JsonView({ source, setError }: ViewerProps) {
  const [content, setContent] = useState<TextContent>()
  const [json, setJson] = useState<unknown>()
  const [isLoading, setIsLoading] = useState(true)

  const { resolveUrl, requestInit } = source

  // Load json content
  useEffect(() => {
    async function loadContent() {
      try {
        const res = await fetch(resolveUrl, requestInit)
        const futureText = res.text()
        if (res.status === 401) {
          const text = await futureText
          setError(new Error(text))
          setContent(undefined)
          return
        }
        const fileSize = parseFileSize(res.headers) ?? (await futureText).length
        if (fileSize > largeFileSize) {
          setError(new Error('File is too large to display'))
          setContent(undefined)
          return
        }
        const text = await futureText
        setError(undefined)
        setContent({ text, fileSize })
        setJson(JSON.parse(text))
      } catch (error) {
        // TODO: show plain text in error case
        setError(error as Error)
      } finally {
        setIsLoading(false)
      }
    }

    setIsLoading(true)
    void loadContent()
  }, [resolveUrl, requestInit, setError])

  const headers = content?.text === undefined && <span>Loading...</span>

  const isLarge = content?.fileSize && content.fileSize > 1024 * 1024

  // If json failed to parse, show the text instead
  const showFallbackText = content?.text !== undefined && json === undefined

  return <ContentHeader content={content} headers={headers}>
    {!isLarge && <>
      {!showFallbackText && <code className={styles.jsonView}>
        <Json json={json} />
      </code>}
      {showFallbackText && <code className={styles.text}>
        {content.text}
      </code>}
    </>}
    {isLarge && <div className='center'>
      File is too large to display
    </div>}

    {isLoading && <div className='center'><Spinner /></div>}
  </ContentHeader>
}
