import { ReactNode } from 'react'
import Page, { PageProps } from './Page.js'
import Welcome from './Welcome.js'

import { AsyncBufferFrom, DataFrame, Row, asyncBufferFrom, parquetQueryWorker, rowCache } from '@hyparam/utils'
import { FileMetaData, byteLengthFromUrl, parquetMetadataAsync, parquetSchema } from 'hyparquet'
import { useCallback, useEffect, useState } from 'react'
import Dropzone from './Dropzone.js'
import Layout from './Layout.js'

export default function App(): ReactNode {
  const params = new URLSearchParams(location.search)
  const url = params.get('key') ?? undefined

  const [error, setError] = useState<Error>()
  const [pageProps, setPageProps] = useState<PageProps>()

  const setUnknownError = useCallback((e: unknown) => {
    setError(e instanceof Error ? e : new Error(String(e)))
  }, [])

  const onUrlDrop = useCallback(
    (url: string) => {
      // Add key=url to query string
      const params = new URLSearchParams(location.search)
      params.set('key', url)
      history.pushState({}, '', `${location.pathname}?${params}`)
      byteLengthFromUrl(url).then(byteLength => setAsyncBuffer(url, { url, byteLength })).catch(setUnknownError)
    },
    [setUnknownError],
  )

  useEffect(() => {
    if (!pageProps && url) {
      onUrlDrop(url)
    }
  }, [ url, pageProps, onUrlDrop])

  function onFileDrop(file: File) {
    // Clear query string
    history.pushState({}, '', location.pathname)
    setAsyncBuffer(file.name, { file, byteLength: file.size }).catch(setUnknownError)
  }

  async function setAsyncBuffer(name: string, from: AsyncBufferFrom) {
    const asyncBuffer = await asyncBufferFrom(from)
    const metadata = await parquetMetadataAsync(asyncBuffer)
    const df = rowCache(parquetDataFrame(from, metadata))
    setPageProps({ metadata, df, name, byteLength: from.byteLength, setError })
  }

  return <Layout error={error}>
    <Dropzone
      onError={(e) => { setError(e) }}
      onFileDrop={onFileDrop}
      onUrlDrop={onUrlDrop}>
      {pageProps ? <Page {...pageProps} /> : <Welcome />}
    </Dropzone>
  </Layout>
}

/**
 * Convert a parquet file into a dataframe.
 */
function parquetDataFrame(from: AsyncBufferFrom, metadata: FileMetaData): DataFrame {
  const { children } = parquetSchema(metadata)
  return {
    header: children.map(child => child.element.name),
    numRows: Number(metadata.num_rows),
    /**
     * @param {number} rowStart
     * @param {number} rowEnd
     * @param {string} orderBy
     * @returns {Promise<any[][]>}
     */
    rows(rowStart: number, rowEnd: number, orderBy: string): Promise<Row[]> {
      console.log(`reading rows ${rowStart}-${rowEnd}`, orderBy)
      return parquetQueryWorker({ from, metadata, rowStart, rowEnd, orderBy })
    },
    sortable: true,
  }
}
