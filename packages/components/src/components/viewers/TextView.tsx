import { useEffect, useRef, useState } from 'react'
import { Spinner } from '../Layout.tsx'
import ContentHeader, {TextContent} from './ContentHeader.tsx'
import { parseFileSize } from '../../lib/files.ts'

enum LoadingState {
  NotLoaded,
  Loading,
  Loaded
}

interface ViewerProps {
  url: string
  setError: (error: Error | undefined) => void
  setProgress: (progress: number | undefined) => void
}

/**
 * Text viewer component.
 */
export default function TextView({ url, setError }: ViewerProps) {
  const [loading, setLoading] = useState(LoadingState.NotLoaded)
  const [content, setContent] = useState<TextContent>()
  const textRef = useRef<HTMLPreElement>(null)

  // Load plain text content
  useEffect(() => {
    async function loadContent() {
      try {
        const res = await fetch(url)
        const text = await res.text()
        const fileSize = parseFileSize(res.headers) ?? text.length
        if (res.status == 401) {
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

    setLoading((loading)=> {
      // use loading state to ensure we only load content once
      if (loading !== LoadingState.NotLoaded) return loading
      loadContent().catch(() => undefined)
      return LoadingState.Loading
    })
  }, [url, setError])

  const headers = <>
    <span>{newlines(content?.text ?? "")} lines</span>
  </>

  // Simple text viewer
  return <ContentHeader content={content} headers={headers}>
    <code className='text' ref={textRef}>
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
