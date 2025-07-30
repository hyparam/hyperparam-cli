import { useEffect, useState } from 'react'
import { useConfig } from '../../hooks/useConfig.js'
import { FileSource } from '../../lib/sources/types.js'
import { cn, parseFileSize } from '../../lib/utils.js'
import ContentWrapper, { TextContent } from '../ContentWrapper/ContentWrapper.js'
import styles from './TextView.module.css'

interface ViewerProps {
  source: FileSource
  setError: (error: unknown) => void
}

/**
 * Text viewer component.
 */
export default function TextView({ source, setError }: ViewerProps) {
  const [content, setContent] = useState<TextContent>()
  const [isLoading, setIsLoading] = useState(true)
  const { customClass } = useConfig()

  const { resolveUrl, requestInit } = source

  // Load plain text content
  useEffect(() => {
    async function loadContent() {
      try {
        setIsLoading(true)
        const res = await fetch(resolveUrl, requestInit)
        const text = await res.text()
        const fileSize = parseFileSize(res.headers) ?? text.length
        if (res.status >= 400) {
          setError(new Error(text))
          setContent(undefined)
          return
        }
        setError(undefined)
        setContent({ text, fileSize })
      } catch (error) {
        setError(error)
        setContent(undefined)
      } finally {
        setIsLoading(false)
      }
    }
    void loadContent()
  }, [resolveUrl, requestInit, setError])

  const headers = <>
    <span>{newlines(content?.text ?? '')} lines</span>
  </>

  // Simple text viewer
  return <ContentWrapper content={content} headers={headers} isLoading={isLoading}>
    {content && <code className={cn(styles.textView, customClass?.textView)}>
      {content.text}
    </code>}
  </ContentWrapper>
}

function newlines(str: string): string {
  let count = 0
  for (const c of str) {
    if (c === '\n') count++
  }
  return count.toLocaleString('en-US')
}
