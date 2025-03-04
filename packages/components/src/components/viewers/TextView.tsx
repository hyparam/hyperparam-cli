import { useEffect, useState } from 'react'
import { FileSource } from '../../lib/sources/types.js'
import { parseFileSize } from '../../lib/utils.js'
import { Spinner } from '../Layout.js'
import ContentHeader, { TextContent } from './ContentHeader.js'

interface ViewerProps {
  source: FileSource
  setError: (error: Error | undefined) => void
  setProgress: (progress: number | undefined) => void
}

/**
 * Text viewer component.
 */
export default function TextView({ source, setError }: ViewerProps) {
  const [content, setContent] = useState<TextContent>()
  const [isLoading, setIsLoading] = useState(true)

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
        setError(error as Error)
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
  return <ContentHeader content={content} headers={headers}>
    {content && <code className='text'>
      {content.text}
    </code>}

    {isLoading && <div className='center'><Spinner /></div>}
  </ContentHeader>
}

function newlines(str: string): string {
  let count = 0
  for (const c of str) {
    if (c === '\n') count++
  }
  return count.toLocaleString('en-US')
}
