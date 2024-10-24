import HighTable, { DataFrame, rowCache } from 'hightable'
import React, { useCallback, useEffect, useState } from 'react'
import { parquetDataFrame } from '../../tableProvider.js'
import { Spinner } from '../Layout.js'
import ContentHeader from './ContentHeader.js'
import { asyncBufferFromUrl, parquetMetadataAsync } from 'hyparquet'

enum LoadingState {
  NotLoaded,
  Loading,
  Loaded
}

interface ViewerProps {
  file: string
  setProgress: (progress: number) => void
  setError: (error: Error) => void
}

interface Content {
  dataframe: DataFrame
  fileSize?: number
}

/**
 * Parquet file viewer
 */
export default function ParquetView({ file, setProgress, setError }: ViewerProps) {
  const [loading, setLoading] = useState<LoadingState>(LoadingState.NotLoaded)
  const [content, setContent] = useState<Content>()

  const isUrl = file.startsWith('http://') || file.startsWith('https://')
  const url = isUrl ? file : '/api/store/get?key=' + file

  useEffect(() => {
    async function loadParquetDataFrame() {
      try {
        setProgress(0.33)
        const asyncBuffer = await asyncBufferFromUrl(url)
        const from = { url, byteLength: asyncBuffer.byteLength }
        setProgress(0.66)
        const metadata = await parquetMetadataAsync(asyncBuffer)
        let dataframe = parquetDataFrame(from, metadata)
        dataframe = rowCache(dataframe)
        const fileSize = asyncBuffer.byteLength
        setContent({ dataframe, fileSize })
      } catch (error) {
        setError(error as Error)
      } finally {
        setLoading(LoadingState.Loaded)
        setProgress(1)
      }
    }
    if (loading === LoadingState.NotLoaded) {
      setLoading(LoadingState.Loading)
      loadParquetDataFrame()
    }
  }, [])

  const onDoubleClickCell = useCallback((col: number, row: number) => {
    location.href = '/files?key=' + file + '&row=' + row + '&col=' + col
  }, [file])

  const headers = <>
    {content?.dataframe && <span>{content.dataframe.numRows.toLocaleString()} rows</span>}
  </>

  return <ContentHeader content={content} headers={headers}>
    {content?.dataframe && <HighTable
      cacheKey={url}
      data={content.dataframe}
      onDoubleClickCell={onDoubleClickCell}
      onError={setError} />}

    {loading && <Spinner className='center' />}
  </ContentHeader>
}
