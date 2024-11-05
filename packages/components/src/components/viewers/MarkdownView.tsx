import { useEffect, useState } from 'react'
import { Spinner } from '../Layout.tsx'
import Markdown from '../Markdown.tsx'
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
}

/**
 * Markdown viewer component.
 */
export default function MarkdownView({ url, setError }: ViewerProps) {
  const [loading, setLoading] = useState(LoadingState.NotLoaded)
  const [content, setContent] = useState<TextContent>()


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

    setLoading((loading) => {
      // use loading state to ensure we only load content once
      if (loading !== LoadingState.NotLoaded) return loading
      loadContent().catch(() => undefined)
      return LoadingState.Loading
    })
  }, [url, setError])

  return <ContentHeader content={content}>
    <Markdown className='markdown' text={content?.text ?? ''} />

    { loading === LoadingState.Loading && <Spinner className='center' /> }
  </ContentHeader>
}
