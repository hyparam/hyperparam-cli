import { useEffect, useState } from 'react'
import type { FileSource } from '../../lib/sources/types.js'
import { parseFileSize } from '../../lib/utils.js'
import { Spinner } from '../Layout.js'
import Markdown from '../Markdown.js'
import ContentHeader, { TextContent } from './ContentHeader.js'

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

  return <ContentHeader content={content}>
    <Markdown className='markdown' text={content?.text ?? ''} />

    { isLoading && <div className='center'><Spinner /></div> }
  </ContentHeader>
}
