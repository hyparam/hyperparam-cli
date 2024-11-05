import { imageTypes } from "../lib/files.ts";
import ImageView from "./viewers/ImageView.tsx";
import MarkdownView from "./viewers/MarkdownView.tsx";
import TableView from "./viewers/ParquetView.tsx";
import TextView from "./viewers/TextView.tsx";

interface ViewerProps {
  url: string;
  setError: (error: Error | undefined) => void;
  setProgress: (progress: number | undefined) => void;
}

/**
 * Get a viewer for a file.
 * Chooses viewer based on content type.
 */
export default function Viewer({
  url,
  setError,
  setProgress,
}: ViewerProps) {
  const filename = url.replace(/\?.*$/, ""); // remove query string
  if (filename.endsWith(".md")) {
    return <MarkdownView url={url} setError={setError} />;
  } else if (filename.endsWith(".parquet")) {
    return (
      <TableView
        file={url}
        setError={setError}
        setProgress={setProgress}
      />
    );
  } else if (imageTypes.some((type) => filename.endsWith(type))) {
    return <ImageView url={url} setError={setError} />;
  }

  // Default to text viewer
  return (
    <TextView url={url} setError={setError} setProgress={setProgress} />
  );
}
