import { FileKey, UrlKey, parseFileSize } from '@hyparam/utils'
import { useEffect, useState } from 'react'
import { Spinner } from '../Layout.js'
import Markdown from '../Markdown.js'
import ContentHeader, { TextContent } from './ContentHeader.js'

enum LoadingState {
  NotLoaded,
  Loading,
  Loaded
}

interface ViewerProps {
  parsedKey: UrlKey | FileKey
  setError: (error: Error | undefined) => void
}

/**
 * Markdown viewer component.
 */
export default function MarkdownView({ parsedKey, setError }: ViewerProps) {
  const [loading, setLoading] = useState(LoadingState.NotLoaded)
  const [content, setContent] = useState<TextContent>()

  const { resolveUrl } = parsedKey

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

  return <ContentHeader content={content}>
    <Markdown className='markdown' text={content?.text ?? ''} />

    { loading === LoadingState.Loading && <Spinner className='center' /> }
  </ContentHeader>
}
