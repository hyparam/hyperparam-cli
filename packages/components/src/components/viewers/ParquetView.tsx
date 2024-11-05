import HighTable, { DataFrame, rowCache } from "hightable";
import { useCallback, useEffect, useState } from "react";
import { parquetDataFrame } from "../../lib/tableProvider.ts";
import { Spinner } from "../Layout.tsx";
import ContentHeader, {ContentSize} from "./ContentHeader.tsx";
import { parquetMetadataAsync } from "hyparquet";
import { asyncBufferFromUrl } from "../../lib/utils.ts";
import {FileKey, UrlKey} from '../../lib/key.ts'

enum LoadingState {
  NotLoaded,
  Loading,
  Loaded
}

interface ViewerProps {
  parsedKey: UrlKey | FileKey
  setProgress: (progress: number | undefined) => void
  setError: (error: Error | undefined) => void
}

interface Content extends ContentSize {
  dataframe: DataFrame
}

/**
 * Parquet file viewer
 */
export default function ParquetView({ parsedKey, setProgress, setError }: ViewerProps) {
  const [loading, setLoading] = useState<LoadingState>(LoadingState.NotLoaded)
  const [content, setContent] = useState<Content>()

  const {resolveUrl, raw} = parsedKey
  useEffect(() => {
    async function loadParquetDataFrame() {
      try {
        setProgress(0.33)
        const asyncBuffer = await asyncBufferFromUrl({url: resolveUrl, headers: {}})
        const from = { url: resolveUrl, byteLength: asyncBuffer.byteLength, headers: {} }
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
      loadParquetDataFrame().catch(() => undefined);
    }
  }, [loading, resolveUrl, setError, setProgress]);

  const onDoubleClickCell = useCallback((col: number, row: number) => {
    location.href = '/files?key=' + raw + '&row=' + row + '&col=' + col
  }, [raw])

  const onMouseDownCell = useCallback((event: React.MouseEvent, col: number, row: number) => {
    if (event.button === 1) {
      // Middle click open in new tab
      event.preventDefault()
      window.open('/files?key=' + raw + '&row=' + row + '&col=' + col, '_blank')
    }
  }, [raw])

  const headers = <>
    {content?.dataframe && <span>{content.dataframe.numRows.toLocaleString()} rows</span>}
  </>

  return <ContentHeader content={content} headers={headers}>
    {content?.dataframe && <HighTable
      cacheKey={resolveUrl}
      data={content.dataframe}
      onDoubleClickCell={onDoubleClickCell}
      onMouseDownCell={onMouseDownCell}
      onError={setError} />}

    {loading && <Spinner className='center' />}
  </ContentHeader>
}
