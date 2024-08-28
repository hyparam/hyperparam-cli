import React, { useEffect, useState } from 'react'

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
 * Image viewer component.
 */
export default function ImageView({ content, setError }: ViewerProps) {
  const [loading, setLoading] = useState(LoadingState.NotLoaded)
  const [dataUri, setDataUri] = useState<string>()

  const isUrl = content.startsWith('http://') || content.startsWith('https://')
  const url = isUrl ? content : '/api/store/get?key=' + content

  useEffect(() => {
    async function loadContent() {
      try {
        const res = await fetch(url)
        const arrayBuffer = await res.arrayBuffer()
        // base64 encode and display image
        const b64 = arrayBufferToBase64(arrayBuffer)
        const dataUri = `data:${contentType(content)};base64,${b64}`
        setDataUri(dataUri)
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
    {dataUri && <img
      alt={content}
      className='image'
      src={dataUri} />}
  </div>
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
