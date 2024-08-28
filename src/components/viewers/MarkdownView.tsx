import React from 'react'
import { useEffect, useState } from 'react'
import Markdown from '../Markdown.js'

enum LoadingState {
  NotLoaded,
  Loading,
  Loaded
}

interface ViewerProps {
  content: string
  setError: (error: Error) => void
}

/**
 * Markdown viewer component.
 */
export default function MarkdownView({ content, setError }: ViewerProps) {
  const [loading, setLoading] = useState(LoadingState.NotLoaded)
  const [text, setText] = useState<string>('')

  const isUrl = content.startsWith('http://') || content.startsWith('https://')
  const url = isUrl ? content : '/api/store/get?key=' + content

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
  }, [content, loading, setError])

  return <div className='viewer'>
    <Markdown className='markdown' text={text} />
  </div>
}
