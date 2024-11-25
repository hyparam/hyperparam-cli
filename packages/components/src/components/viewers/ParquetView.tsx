import HighTable, { DataFrame, rowCache } from 'hightable'
import { asyncBufferFromUrl, parquetMetadataAsync } from 'hyparquet'
import React, { useCallback, useEffect, useState } from 'react'
import { FileKey, UrlKey } from '../../lib/key.js'
import { parquetDataFrame } from '../../lib/tableProvider.js'
import { Spinner } from '../Layout.js'
import CellPanel from './CellPanel.js'
import ContentHeader, { ContentSize } from './ContentHeader.js'
import { SlidePanel, SlidePanelConfig } from './SlidePanel.js'

enum LoadingState {
  NotLoaded,
  Loading,
  Loaded
}

export type ParquetViewConfig = SlidePanelConfig

interface ViewerProps {
  parsedKey: UrlKey | FileKey
  setProgress: (progress: number | undefined) => void
  setError: (error: Error | undefined) => void,
  config?: ParquetViewConfig
}

interface Content extends ContentSize {
  dataframe: DataFrame
}

/**
 * Parquet file viewer
 */
export default function ParquetView({ parsedKey, setProgress, setError, config }: ViewerProps) {
  const [loading, setLoading] = useState<LoadingState>(LoadingState.NotLoaded)
  const [content, setContent] = useState<Content>()
  const [cell, setCell] = useState<{ row: number, col: number } | undefined>()

  const { resolveUrl, raw } = parsedKey
  useEffect(() => {
    async function loadParquetDataFrame() {
      try {
        setProgress(0.33)
        const asyncBuffer = await asyncBufferFromUrl({ url: resolveUrl })
        const from = { url: resolveUrl, byteLength: asyncBuffer.byteLength }
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
      loadParquetDataFrame().catch(() => undefined)
    }
  }, [loading, resolveUrl, setError, setProgress])


  // Clear loading state on content change
  useEffect(() => {
    setLoading(LoadingState.NotLoaded)
  }, [parsedKey])

  // Close cell view on escape key
  useEffect(() => {
    if (!cell) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setCell(undefined)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => { window.removeEventListener('keydown', handleKeyDown) }
  }, [cell])

  const onDoubleClickCell = useCallback((col: number, row: number) => {
    if (cell?.col === col && cell.row === row) {
      setCell(undefined)
    } else {
      setCell({ row, col })
    }
  }, [cell])
  const onMouseDownCell = useCallback((event: React.MouseEvent, col: number, row: number) => {
    if (event.button === 1) {
      // Middle click open in new tab
      event.preventDefault()
      const cellUrl = new URL( '/files', window.location.origin )
      cellUrl.searchParams.set('key', raw)
      cellUrl.searchParams.set('row', row.toString())
      cellUrl.searchParams.set('col', col.toString())
      window.open(cellUrl, '_blank')
    }
  }, [raw])

  const headers = <span>{content?.dataframe.numRows.toLocaleString() ?? '...'} rows</span>

  const mainContent = <ContentHeader content={content} headers={headers}>
    {content?.dataframe && <HighTable
      cacheKey={resolveUrl}
      data={content.dataframe}
      onDoubleClickCell={onDoubleClickCell}
      onMouseDownCell={onMouseDownCell}
      onError={setError} />}

    {loading && <Spinner className='center' />}
  </ContentHeader>

  let panelContent
  if (content?.dataframe && cell) {
    panelContent =
      <CellPanel
        col={cell.col}
        df={content.dataframe}
        onClose={() => { setCell(undefined) }}
        row={cell.row}
        setError={setError}
        setProgress={setProgress}
      />
  }

  return (
    <SlidePanel
      isPanelOpen={!!(content?.dataframe && cell)}
      mainContent={mainContent}
      panelContent={panelContent}
      config={config}
    />
  )
}
