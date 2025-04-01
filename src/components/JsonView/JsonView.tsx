import { useEffect, useState } from 'react'
import type { FileSource } from '../../lib/sources/types.js'
import { parseFileSize } from '../../lib/utils.js'
import Center from '../Center/Center.js'
import ContentWrapper, { TextContent } from '../ContentWrapper/ContentWrapper.js'
import Json from '../Json/Json.js'
import styles from '../Json/Json.module.css'

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
        setIsLoading(true)
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
    void loadContent()
  }, [resolveUrl, requestInit, setError])

  const headers = content?.text === undefined && <span>Loading...</span>

  const isLarge = content?.fileSize && content.fileSize > 1024 * 1024

  // If json failed to parse, show the text instead
  const showFallbackText = content?.text !== undefined && json === undefined

  return <ContentWrapper content={content} headers={headers} isLoading={isLoading}>
    {isLarge ?
      <Center>File is too large to display</Center>
      :
      <>
        {!showFallbackText && <code className={styles.jsonView}>
          <Json json={json} />
        </code>}
        {showFallbackText && <code className={styles.text}>
          {content.text}
        </code>}
      </>
    }
  </ContentWrapper>
}
