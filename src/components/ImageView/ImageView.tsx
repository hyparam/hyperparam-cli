import { useEffect, useState } from 'react'
import { useConfig } from '../../hooks/useConfig.js'
import { FileSource } from '../../lib/sources/types.js'
import { cn, contentTypes, parseFileSize } from '../../lib/utils.js'
import ContentWrapper from '../ContentWrapper/ContentWrapper.js'
import styles from './ImageView.module.css'

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
  const { customClass } = useConfig()

  const { fileName, resolveUrl, requestInit } = source

  useEffect(() => {
    async function loadContent() {
      try {
        setIsLoading(true)
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
    void loadContent()
  }, [fileName, resolveUrl, requestInit, setError])

  return <ContentWrapper content={content} isLoading={isLoading}>
    {content?.dataUri && <img
      alt={source.sourceId}
      className={cn(styles.image, customClass?.imageView)}
      src={content.dataUri} />}
  </ContentWrapper>
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
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}

function contentType(filename: string): string {
  const ext = filename.split('.').pop() ?? ''
  return contentTypes[ext] ?? 'image/png'
}
