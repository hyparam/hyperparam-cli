import HighTable, { DataFrame } from 'hightable'
import 'hightable/src/HighTable.css'
import { asyncBufferFromUrl, parquetMetadataAsync } from 'hyparquet'
import React, { useCallback, useEffect, useState } from 'react'
import { useConfig } from '../../hooks/useConfig.js'
import { appendSearchParams } from '../../lib/routes.js'
import { FileSource } from '../../lib/sources/types.js'
import { parquetDataFrame } from '../../lib/tableProvider.js'
import { cn } from '../../lib/utils.js'
import CellPanel from '../CellPanel/CellPanel.js'
import ContentWrapper, { ContentSize } from '../ContentWrapper/ContentWrapper.js'
import SlidePanel from '../SlidePanel/SlidePanel.js'
import styles from './ParquetView.module.css'

interface ViewerProps {
  source: FileSource
  setProgress: (progress: number | undefined) => void
  setError: (error: unknown) => void
}

interface Content extends ContentSize {
  dataframe: DataFrame
}

/**
 * Parquet file viewer
 */
export default function ParquetView({ source, setProgress, setError }: ViewerProps) {
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [content, setContent] = useState<Content>()
  const [cell, setCell] = useState<{ row: number, col: number } | undefined>()
  const { customClass, routes } = useConfig()

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
        const dataframe = parquetDataFrame(from, metadata)
        const fileSize = asyncBuffer.byteLength
        setContent({ dataframe, fileSize })
      } catch (error) {
        setError(error)
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
    const url = routes?.getCellRouteUrl?.({ sourceId, col, row })
    if (url) {
      return url
    }
    return appendSearchParams({ col: col.toString(), row: row.toString() })
  }, [routes, sourceId])

  const toggleCell = useCallback((col: number, row: number) => {
    setCell(cell => {
      if (cell?.col === col && cell.row === row) {
        return undefined
      }
      const columnName = content?.dataframe.columnDescriptors[col]?.name
      if (columnName === undefined || !content?.dataframe.getCell({ row, column: columnName })) {
        // don't open the cell panel until it has loaded
        return undefined
      }
      return { row, col }
    })
  }, [content])
  const onDoubleClickCell = useCallback((_event: React.MouseEvent, col: number, row: number) => {
    toggleCell(col, row)
  }, [toggleCell])
  const onKeyDownCell = useCallback((event: React.KeyboardEvent, col: number, row: number) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      toggleCell(col, row)
    }
  }, [toggleCell])
  const onMouseDownCell = useCallback((event: React.MouseEvent, col: number, row: number) => {
    if (event.button === 1) {
      // Middle click open in new tab
      event.preventDefault()
      window.open(getCellRouteUrl({ row, col }), '_blank')
    }
  }, [getCellRouteUrl])

  const headers = <span>{content?.dataframe.numRows.toLocaleString() ?? '...'} rows</span>

  const mainContent = <ContentWrapper content={content} headers={headers} isLoading={isLoading}>
    {content?.dataframe && <HighTable
      cacheKey={source.resolveUrl}
      data={content.dataframe}
      onDoubleClickCell={onDoubleClickCell}
      onMouseDownCell={onMouseDownCell}
      onKeyDownCell={onKeyDownCell}
      onError={setError}
      className={cn(styles.hightable, customClass?.highTable)}
    />}
  </ContentWrapper>

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
    />
  )
}
