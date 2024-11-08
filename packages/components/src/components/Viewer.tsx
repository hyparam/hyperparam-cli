import { imageTypes } from '../lib/files.js'
import { FileKey, UrlKey } from '../lib/key.js'
import ImageView from './viewers/ImageView.js'
import MarkdownView from './viewers/MarkdownView.js'
import TableView from './viewers/ParquetView.js'
import TextView from './viewers/TextView.js'

interface ViewerProps {
  parsedKey: FileKey | UrlKey;
  setError: (error: Error | undefined) => void;
  setProgress: (progress: number | undefined) => void;
}

/**
 * Get a viewer for a file.
 * Chooses viewer based on content type.
 */
export default function Viewer({
  parsedKey,
  setError,
  setProgress,
}: ViewerProps) {
  const { fileName } = parsedKey
  if (fileName.endsWith('.md')) {
    return <MarkdownView parsedKey={parsedKey} setError={setError} />
  } else if (fileName.endsWith('.parquet')) {
    return (
      <TableView
        parsedKey={parsedKey}
        setError={setError}
        setProgress={setProgress}
      />
    )
  } else if (imageTypes.some((type) => fileName.endsWith(type))) {
    return <ImageView parsedKey={parsedKey} setError={setError} />
  }

  // Default to text viewer
  return (
    <TextView parsedKey={parsedKey} setError={setError} setProgress={setProgress} />
  )
}
