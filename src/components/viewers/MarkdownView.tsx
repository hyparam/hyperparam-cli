import React from 'react'
import { useEffect, useState } from 'react'
import Markdown from '../Markdown.js'
import ContentHeader, { parseFileSize } from './ContentHeader.js'

enum LoadingState {
  NotLoaded,
  Loading,
  Loaded
}

interface ViewerProps {
  file: string
  setError: (error: Error) => void
}

interface Content {
  text: string
  fileSize?: number
}

/**
 * Markdown viewer component.
 */
export default function MarkdownView({ file, setError }: ViewerProps) {
  const [loading, setLoading] = useState(LoadingState.NotLoaded)
  const [content, setContent] = useState<Content>()

  const isUrl = file.startsWith('http://') || file.startsWith('https://')
  const url = isUrl ? file : '/api/store/get?key=' + file

  useEffect(() => {
    async function loadContent() {
      try {
        const res = await fetch(url)
        const text = await res.text()
        const fileSize = parseFileSize(res.headers) ?? text.length
        setContent({ text, fileSize })
      } catch (error) {
        setError(error as Error)
      } finally {
        setLoading(LoadingState.Loaded)
      }
    }

    setLoading(loading => {
      // use loading state to ensure we only load content once
      if (loading !== LoadingState.NotLoaded) return loading
      loadContent()
      return LoadingState.Loading
    })
  }, [url, loading, setError])

  return <ContentHeader content={content}>
    <Markdown className='markdown' text={content?.text ?? ''} />
  </ContentHeader>
}
