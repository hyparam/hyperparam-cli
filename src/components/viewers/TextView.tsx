import { useEffect, useRef, useState } from 'react'
import React from 'react'
import { Spinner } from '../Layout.js'
import ContentHeader from './ContentHeader.js'

enum LoadingState {
  NotLoaded,
  Loading,
  Loaded
}

interface ViewerProps {
  file: string
  setError: (error: Error) => void
  setProgress: (progress: number) => void
}

/**
 * Text viewer component.
 */
export default function TextView({ file, setError }: ViewerProps) {
  const [loading, setLoading] = useState(LoadingState.NotLoaded)
  const [text, setText] = useState<string | undefined>()
  const textRef = useRef<HTMLPreElement>(null)

  const isUrl = file.startsWith('http://') || file.startsWith('https://')
  const url = isUrl ? file : '/api/store/get?key=' + file

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
  }, [file, loading, setError])

  const headers = <>
    <span>{text ? newlines(text) : 0} lines</span>
  </>

  // Simple text viewer
  return <ContentHeader content={{ fileSize: text?.length }} headers={headers}>
    <code className='text' ref={textRef}>
      {text}
    </code>

    {loading && <Spinner className='center' />}
  </ContentHeader>
}

function newlines(str: string): string {
  let count = 0
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '\n') count++
  }
  return count.toLocaleString()
}
