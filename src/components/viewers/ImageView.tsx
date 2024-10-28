import React, { useEffect, useState } from 'react'
import ContentHeader, { ContentSize, parseFileSize } from './ContentHeader.js'

enum LoadingState {
  NotLoaded,
  Loading,
  Loaded
}

interface ViewerProps {
  file: string
  setError: (error: Error) => void
}

interface Content extends ContentSize {
  dataUri: string
}

/**
 * Image viewer component.
 */
export default function ImageView({ file, setError }: ViewerProps) {
  const [loading, setLoading] = useState(LoadingState.NotLoaded)
  const [content, setContent] = useState<Content>()

  const isUrl = file.startsWith('http://') || file.startsWith('https://')
  const url = isUrl ? file : '/api/store/get?key=' + file

  useEffect(() => {
    async function loadContent() {
      try {
        const res = await fetch(url)
        const arrayBuffer = await res.arrayBuffer()
        // base64 encode and display image
        const b64 = arrayBufferToBase64(arrayBuffer)
        const dataUri = `data:${contentType(url)};base64,${b64}`
        const fileSize = parseFileSize(res.headers)
        setContent({ dataUri, fileSize })
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
    {content?.dataUri && <img
      alt={file}
      className='image'
      src={content.dataUri} />}
  </ContentHeader>
}

/**
 * Convert an ArrayBuffer to a base64 string.
 *
 * @param buffer - the ArrayBuffer to convert
 * @returns base64 encoded string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function contentType(filename: string): string {
  const ext = filename.split('.').pop() || ''
  return contentTypes[ext] || 'image/png'
}

const contentTypes: { [key: string]: string } = {
  'png': 'image/png',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'gif': 'image/gif',
  'svg': 'image/svg+xml',
}

export const imageTypes = ['.png', '.jpg', '.jpeg', '.gif', '.svg']
