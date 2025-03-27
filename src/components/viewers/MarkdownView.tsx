import { useEffect, useState } from 'react'
import { useConfig } from '../../hooks/useConfig.js'
import type { FileSource } from '../../lib/sources/types.js'
import { cn, parseFileSize } from '../../lib/utils.js'
import styles from '../../styles/viewers/MarkdownView.module.css'
import { Spinner } from '../Layout.js'
import Markdown from '../Markdown.js'
import ContentWrapper, { TextContent } from './ContentWrapper.js'

interface ViewerProps {
  source: FileSource
  setError: (error: Error | undefined) => void
}

/**
 * Markdown viewer component.
 */
export default function MarkdownView({ source, setError }: ViewerProps) {
  const [content, setContent] = useState<TextContent>()
  const [isLoading, setIsLoading] = useState(true)
  const { customClass } = useConfig()

  const { resolveUrl, requestInit } = source

  // Load markdown content
  useEffect(() => {
    async function loadContent() {
      try {
        setIsLoading(true)
        const res = await fetch(resolveUrl, requestInit)
        const text = await res.text()
        const fileSize = parseFileSize(res.headers) ?? text.length
        if (res.status === 401) {
          setError(new Error(text))
          setContent(undefined)
          return
        }
        setError(undefined)
        setContent({ text, fileSize })
      } catch (error) {
        setError(error as Error)
        setContent(undefined)
      } finally {
        setIsLoading(false)
      }
    }
    void loadContent()
  }, [resolveUrl, requestInit, setError])

  return <ContentWrapper content={content}>
    <Markdown className={cn(styles.markdownView, customClass?.markdownView)} text={content?.text ?? ''} />

    { isLoading && <div className='center'><Spinner /></div> }
  </ContentWrapper>
}
