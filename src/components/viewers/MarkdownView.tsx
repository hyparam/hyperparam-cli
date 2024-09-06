import React from 'react'
import { useEffect, useState } from 'react'
import Markdown from '../Markdown.js'
import ContentHeader from './ContentHeader.js'

enum LoadingState {
  NotLoaded,
  Loading,
  Loaded
}

interface ViewerProps {
  file: string
  setError: (error: Error) => void
}

/**
 * Markdown viewer component.
 */
export default function MarkdownView({ file, setError }: ViewerProps) {
  const [loading, setLoading] = useState(LoadingState.NotLoaded)
  const [text, setText] = useState<string | undefined>()

  const isUrl = file.startsWith('http://') || file.startsWith('https://')
  const url = isUrl ? file : '/api/store/get?key=' + file

  useEffect(() => {
    async function loadContent() {
      try {
        const res = await fetch(url)
        const text = await res.text()
        setText(text)
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

  return <ContentHeader content={{ fileSize: text?.length }}>
    <Markdown className='markdown' text={text || ''} />
  </ContentHeader>
}
