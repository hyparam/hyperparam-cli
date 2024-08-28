import React from 'react'
import ImageView, { imageTypes } from './ImageView.js'
import TableView from './ParquetView.js'
import TextView from './TextView.js'
import MarkdownView from './viewers/MarkdownView.js'

interface ViewerProps {
  content: string
  setError: (error: Error) => void
  setProgress: (progress: number) => void
}

/**
 * Get a viewer for a file.
 * Chooses viewer based on content type.
 */
export default function Viewer({ content, setError, setProgress }: ViewerProps) {
  if (content.endsWith('.md')) {
    return <MarkdownView content={content} setError={setError} />
  } else if (content.endsWith('.parquet')) {
    return <TableView content={content} setError={setError} setProgress={setProgress} />
  } else if (imageTypes.some(type => content.endsWith(type))) {
    return <ImageView content={content} setError={setError} />
  }

  // Default to text viewer
  return <TextView
    content={content}
    setError={setError}
    setProgress={setProgress} />
}
