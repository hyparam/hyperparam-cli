import HighTable, { DataFrame } from 'hightable'
import React, { useCallback, useEffect, useState } from 'react'
import { parquetDataFrame } from '../tableProvider.js'
import { Spinner } from './Layout.js'

enum LoadingState {
  NotLoaded,
  Loading,
  Loaded
}

interface ViewerProps {
  content: string
  setProgress: (progress: number) => void
  setError: (error: Error) => void
}

/**
 * Parquet file viewer
 */
export default function ParquetView({ content, setProgress, setError }: ViewerProps) {
  const [loading, setLoading] = useState<LoadingState>(LoadingState.NotLoaded)
  const [dataframe, setDataframe] = useState<DataFrame>()

  const isUrl = content.startsWith('http://') || content.startsWith('https://')
  const url = isUrl ? content : '/api/store/get?key=' + content

  useEffect(() => {
    async function loadParquetDataFrame() {
      try {
        setProgress(0.5)
        const df = await parquetDataFrame(url)
        setDataframe(df)
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

  const onDoubleClickCell = useCallback((row: number, col: number) => {
    location.href = '/files?key=' + content + '&row=' + row + '&col=' + col
  }, [content])

  return <>
    {dataframe && <HighTable
      data={dataframe}
      onDoubleClickCell={onDoubleClickCell}
      onError={setError} />}

    {loading && <Spinner className='center' />}
  </>
}
