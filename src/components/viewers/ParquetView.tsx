import HighTable, { DataFrame, rowCache } from 'hightable'
import { asyncBufferFromUrl, parquetMetadataAsync } from 'hyparquet'
import React, { useCallback, useEffect, useState } from 'react'
import { RoutesConfig, appendSearchParams } from '../../lib/routes.js'
import { FileSource } from '../../lib/sources/types.js'
import { parquetDataFrame } from '../../lib/tableProvider.js'
import { Spinner } from '../Layout.js'
import CellPanel from './CellPanel.js'
import ContentHeader, { ContentSize } from './ContentHeader.js'
import SlidePanel, { SlidePanelConfig } from './SlidePanel.js'

export type ParquetViewConfig = SlidePanelConfig & RoutesConfig

interface ViewerProps {
  source: FileSource
  setProgress: (progress: number | undefined) => void
  setError: (error: Error | undefined) => void
  config?: ParquetViewConfig
}

interface Content extends ContentSize {
  dataframe: DataFrame
}

/**
 * Parquet file viewer
 */
export default function ParquetView({ source, setProgress, setError, config }: ViewerProps) {
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [content, setContent] = useState<Content>()
  const [cell, setCell] = useState<{ row: number, col: number } | undefined>()

  useEffect(() => {
    async function loadParquetDataFrame() {
      try {
        setIsLoading(true)
        setProgress(0.33)
        const { resolveUrl, requestInit } = source
        const asyncBuffer = await asyncBufferFromUrl({ url: resolveUrl, requestInit })
        const from = { url: resolveUrl, byteLength: asyncBuffer.byteLength, requestInit }
        setProgress(0.66)
        const metadata = await parquetMetadataAsync(asyncBuffer)
        let dataframe = parquetDataFrame(from, metadata)
        dataframe = rowCache(dataframe)
        const fileSize = asyncBuffer.byteLength
        setContent({ dataframe, fileSize })
      } catch (error) {
        setError(error as Error)
      } finally {
        setIsLoading(false)
        setProgress(1)
      }
    }
    void loadParquetDataFrame()
  }, [setError, setProgress, source])

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

  const { sourceId } = source
  const getCellRouteUrl = useCallback(({ col, row }: {col: number, row: number}) => {
    const url = config?.routes?.getCellRouteUrl?.({ sourceId, col, row })
    if (url) {
      return url
    }
    return appendSearchParams({ col: col.toString(), row: row.toString() })
  }, [config, sourceId])

  const onDoubleClickCell = useCallback((_event: React.MouseEvent, col: number, row: number) => {
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
      window.open(getCellRouteUrl({ row, col }), '_blank')
    }
  }, [getCellRouteUrl])

  const headers = <span>{content?.dataframe.numRows.toLocaleString() ?? '...'} rows</span>

  const mainContent = <ContentHeader content={content} headers={headers}>
    {content?.dataframe && <HighTable
      cacheKey={source.resolveUrl}
      data={content.dataframe}
      onDoubleClickCell={onDoubleClickCell}
      onMouseDownCell={onMouseDownCell}
      onError={setError} />}

    {isLoading && <div className='center'><Spinner /></div>}
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
