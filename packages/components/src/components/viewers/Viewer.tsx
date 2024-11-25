import { imageTypes } from '../../lib/files.js'
import { FileKey, UrlKey } from '../../lib/key.js'
import ImageView from './ImageView.js'
import MarkdownView from './MarkdownView.js'
import TableView, { ParquetViewConfig } from './ParquetView.js'
import TextView from './TextView.js'

export type ViewerConfig = ParquetViewConfig

interface ViewerProps {
  parsedKey: FileKey | UrlKey;
  setError: (error: Error | undefined) => void;
  setProgress: (progress: number | undefined) => void;
  config?: ViewerConfig;
}

/**
 * Get a viewer for a file.
 * Chooses viewer based on content type.
 */
export default function Viewer({
  parsedKey,
  setError,
  setProgress,
  config,
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
        config={config}
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
