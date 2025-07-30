import { avroMetadata, avroRead } from 'icebird'
import { useEffect, useState } from 'react'
import type { FileSource } from '../../lib/sources/types.js'
import { parseFileSize } from '../../lib/utils.js'
import ContentWrapper, { ContentSize } from '../ContentWrapper/ContentWrapper.js'
import Json from '../Json/Json.js'
import styles from '../Json/Json.module.css'

interface ViewerProps {
  source: FileSource
  setError: (error: unknown) => void
}

/**
 * Apache Avro viewer component.
 */
export default function AvroView({ source, setError }: ViewerProps) {
  const [content, setContent] = useState<ContentSize>()
  const [json, setJson] = useState<unknown>()
  const [isLoading, setIsLoading] = useState(true)

  const { resolveUrl, requestInit } = source

  // Load avro content as json
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
        // Parse avro file
        const buffer = await res.arrayBuffer()
        const fileSize = parseFileSize(res.headers) ?? buffer.byteLength
        const reader = { view: new DataView(buffer), offset: 0 }
        const { metadata, syncMarker } = avroMetadata(reader)
        const json = avroRead({ reader, metadata, syncMarker })
        setError(undefined)
        setContent({ fileSize })
        setJson(json)
      } catch (error) {
        setError(error)
      } finally {
        setIsLoading(false)
      }
    }
    void loadContent()
  }, [resolveUrl, requestInit, setError])

  const headers = content === undefined && <span>Loading...</span>

  return <ContentWrapper content={content} headers={headers} isLoading={isLoading}>
    <code className={styles.jsonView}>
      <Json json={json} />
    </code>
  </ContentWrapper>
}
