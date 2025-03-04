import { useEffect, useState } from 'react'
import { FileSource } from '../../lib/sources/types.js'
import { contentTypes, parseFileSize } from '../../lib/utils.js'
import { Spinner } from '../Layout.js'
import ContentHeader from './ContentHeader.js'

interface ViewerProps {
  source: FileSource
  setError: (error: Error | undefined) => void
}

interface Content {
  dataUri: string
  fileSize?: number
}

/**
 * Image viewer component.
 */
export default function ImageView({ source, setError }: ViewerProps) {
  const [content, setContent] = useState<Content>()
  const [isLoading, setIsLoading] = useState(true)

  const { fileName, resolveUrl, requestInit } = source

  useEffect(() => {
    async function loadContent() {
      try {
        const res = await fetch(resolveUrl, requestInit)
        if (res.status === 401) {
          const text = await res.text()
          setError(new Error(text))
          setContent(undefined)
          return
        }
        const arrayBuffer = await res.arrayBuffer()
        // base64 encode and display image
        const b64 = arrayBufferToBase64(arrayBuffer)
        const dataUri = `data:${contentType(fileName)};base64,${b64}`
        const fileSize = parseFileSize(res.headers)
        setContent({ dataUri, fileSize })
        setError(undefined)
      } catch (error) {
        setContent(undefined)
        setError(error as Error)
      } finally {
        setIsLoading(false)
      }
    }

    setIsLoading(true)
    void loadContent()
  }, [fileName, resolveUrl, requestInit, setError])

  return <ContentHeader content={content}>
    {content?.dataUri && <img
      alt={source.sourceId}
      className='image'
      src={content.dataUri} />}

    {isLoading && <div className='center'><Spinner /></div>}
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
  const ext = filename.split('.').pop() ?? ''
  return contentTypes[ext] || 'image/png'
}
