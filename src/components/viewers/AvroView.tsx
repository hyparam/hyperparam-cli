import { useEffect, useState } from 'react'
import type { FileSource } from '../../lib/sources/types.js'
import { parseFileSize } from '../../lib/utils.js'
import styles from '../../styles/Json.module.css'
import Json from '../Json.js'
import { Spinner } from '../Layout.js'
import ContentHeader, { ContentSize } from './ContentHeader.js'
import { avroData, avroMetadata } from 'icebird'

interface ViewerProps {
  source: FileSource
  setError: (error: Error | undefined) => void
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
        const json = avroData({ reader, metadata, syncMarker })
        setError(undefined)
        setContent({ fileSize })
        setJson(json)
      } catch (error) {
        setError(error as Error)
      } finally {
        setIsLoading(false)
      }
    }
    void loadContent()
  }, [resolveUrl, requestInit, setError])

  const headers = content === undefined && <span>Loading...</span>

  return <ContentHeader content={content} headers={headers}>
    <code className={styles.jsonView}>
      <Json json={json} />
    </code>

    {isLoading && <div className='center'><Spinner /></div>}
  </ContentHeader>
}
