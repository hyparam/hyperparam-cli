import { FileSource } from '../../lib/sources/types.js'
import { imageTypes } from '../../lib/utils.js'
import AvroView from '../AvroView/AvroView.js'
import ImageView from '../ImageView/ImageView.js'
import JsonView from '../JsonView/JsonView.js'
import MarkdownView from '../MarkdownView/MarkdownView.js'
import TableView from '../ParquetView/ParquetView.js'
import TextView from '../TextView/TextView.js'

interface ViewerProps {
  source: FileSource
  setError: (error: unknown) => void
  setProgress: (progress: number | undefined) => void
}

/**
 * Get a viewer for a file.
 * Chooses viewer based on content type.
 */
export default function Viewer({ source, setError, setProgress }: ViewerProps) {
  const { fileName } = source
  if (fileName.endsWith('.md')) {
    return <MarkdownView source={source} setError={setError} />
  } else if (fileName.endsWith('.parquet')) {
    return <TableView source={source} setError={setError} setProgress={setProgress} />
  } else if (fileName.endsWith('.json')) {
    return <JsonView source={source} setError={setError} />
  } else if (fileName.endsWith('.avro')) {
    return <AvroView source={source} setError={setError} />
  } else if (imageTypes.some((type) => fileName.endsWith(type))) {
    return <ImageView source={source} setError={setError} />
  }

  // Default to text viewer
  return (
    <TextView source={source} setError={setError} />
  )
}
