import { FileSource } from '../../lib/filesystem.js'
import { imageTypes } from '../../lib/utils.js'
import ImageView from './ImageView.js'
import MarkdownView from './MarkdownView.js'
import TableView, { ParquetViewConfig } from './ParquetView.js'
import TextView from './TextView.js'

export type ViewerConfig = ParquetViewConfig

interface ViewerProps {
  source: FileSource;
  setError: (error: Error | undefined) => void;
  setProgress: (progress: number | undefined) => void;
  config?: ViewerConfig;
}

/**
 * Get a viewer for a file.
 * Chooses viewer based on content type.
 */
export default function Viewer({
  source,
  setError,
  setProgress,
  config,
}: ViewerProps) {
  const { fileName } = source
  if (fileName.endsWith('.md')) {
    return <MarkdownView source={source} setError={setError} />
  } else if (fileName.endsWith('.parquet')) {
    return (
      <TableView
        source={source}
        setError={setError}
        setProgress={setProgress}
        config={config}
      />
    )
  } else if (imageTypes.some((type) => fileName.endsWith(type))) {
    return <ImageView source={source} setError={setError} />
  }

  // Default to text viewer
  return (
    <TextView source={source} setError={setError} setProgress={setProgress} />
  )
}
