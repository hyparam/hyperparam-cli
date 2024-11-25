import { useEffect, useState } from 'react'
import { parseFileSize } from '../../lib/files.js'
import { FileKey, UrlKey } from '../../lib/key.js'
import { Spinner } from '../Layout.js'
import ContentHeader, { TextContent } from './ContentHeader.js'

enum LoadingState {
  NotLoaded,
  Loading,
  Loaded
}

interface ViewerProps {
  parsedKey: UrlKey | FileKey
  setError: (error: Error | undefined) => void
  setProgress: (progress: number | undefined) => void
}

/**
 * Text viewer component.
 */
export default function TextView({ parsedKey, setError }: ViewerProps) {
  const [loading, setLoading] = useState(LoadingState.NotLoaded)
  const [content, setContent] = useState<TextContent>()

  const { resolveUrl } = parsedKey

  // Load plain text content
  useEffect(() => {
    async function loadContent() {
      try {
        const res = await fetch(resolveUrl)
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
        setLoading(LoadingState.Loaded)
      }
    }

    setLoading((loading) => {
      // use loading state to ensure we only load content once
      if (loading !== LoadingState.NotLoaded) return loading
      loadContent().catch(() => undefined)
      return LoadingState.Loading
    })
  }, [resolveUrl, setError])

  const headers = <>
    <span>{newlines(content?.text ?? '')} lines</span>
  </>

  // Simple text viewer
  return <ContentHeader content={content} headers={headers}>
    <code className='text'>
      {content?.text}
    </code>

    {loading && <Spinner className='center' />}
  </ContentHeader>
}

function newlines(str: string): string {
  let count = 0
  for (const c of str) {
    if (c === '\n') count++
  }
  return count.toLocaleString('en-US')
}
