import { useEffect, useRef, useState } from 'react'
import React from 'react'

enum LoadingState {
  NotLoaded,
  Loading,
  Loaded
}

interface ViewerProps {
  content: string
  setError: (error: Error) => void
  setProgress: (progress: number) => void
}

/**
 * Text viewer component.
 */
export default function TextView({ content, setError }: ViewerProps) {
  const [loading, setLoading] = useState(LoadingState.NotLoaded)
  const [text, setText] = useState<string | undefined>()
  const textRef = useRef<HTMLPreElement>(null)

  const isUrl = content.startsWith('http://') || content.startsWith('https://')
  const url = isUrl ? content : '/api/store/get?key=' + content

  // Load plain text content
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

  if (loading === LoadingState.Loading) {
    return <span>loading...</span>
  } else if (text === undefined) {
    // Loading failed
    return null
  } else {
    // Simple text viewer
    return <code className='text' ref={textRef}>
      {text}
    </code>
  }
}
