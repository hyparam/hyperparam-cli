export interface FileMetadata {
  key: string
  eTag?: string
  fileSize?: number
  lastModified: string
}

export interface FileContent<T> {
  body: T
  key: string
  contentLength?: number
  contentType?: string
  eTag?: string
  fileName?: string
  fileSize?: number
  lastModified?: string
  contentRange?: string
}

/**
 * List user files from server
 *
 * @param prefix file path prefix
 */
export async function listFiles(prefix: string, recursive?: boolean): Promise<FileMetadata[]> {
  const rec = recursive ? '&recursive=true' : ''
  prefix = encodeURIComponent(prefix)
  const res = await fetch(`/api/store/list?prefix=${prefix}${rec}`)
  if (res.ok) {
    return await res.json()
  } else {
    throw new Error(`file list error ${res.status} ${await res.text()}`)
  }
}

export function getFileDateShort(file?: { lastModified?: string }): string {
  if (!file?.lastModified) return ''
  const date = new Date(file.lastModified)
  // time if within last 24 hours, date otherwise
  const time = date.getTime()
  const now = Date.now()
  if (now - time < 86400000) {
    return date.toLocaleTimeString()
  }
  return date.toLocaleDateString()
}

/**
 * Parse date from lastModified field and format as locale string
 *
 * @param file file-like object with lastModified
 * @param file.lastModified last modified date string
 * @returns formatted date string
 */
export function getFileDate(file?: { lastModified?: string }): string {
  if (!file?.lastModified) return ''
  const date = new Date(file.lastModified)
  return isFinite(date.getTime()) ? date.toLocaleString() : ''
}

/**
 * Format file size in human readable format
 *
 * @param file file-like object with fileSize
 * @param file.fileSize file size in bytes
 * @returns formatted file size string
 */
export function getFileSize(file?: { fileSize?: number }): string {
  return file?.fileSize !== undefined ? formatFileSize(file.fileSize) : "";
}

/**
 * Returns the file size in human readable format
 *
 * @param bytes file size in bytes
 * @returns formatted file size string
 */
export function formatFileSize(bytes: number): string {
  const sizes = ["b", "kb", "mb", "gb", "tb"];
  if (bytes === 0) return "0 b";
  const i = Math.floor(Math.log2(bytes) / 10);
  if (i === 0) return bytes.toLocaleString("en-US") + " b";
  const base = bytes / Math.pow(1024, i);
  return (
    (base < 10 ? base.toFixed(1) : Math.round(base)).toLocaleString("en-US") +
    " " +
    sizes[i]
  );
}

/**
 * Parse the content-length header from a fetch response.
 *
 * @param headers fetch response headers
 * @returns content length in bytes or undefined if not found
 */
export function parseFileSize(headers: Headers): number | undefined {
  const contentLength = headers.get("content-length");
  return contentLength ? Number(contentLength) : undefined;
}

export const contentTypes: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  svg: "image/svg+xml",
  tiff: "image/tiff",
  webp: "image/webp",
};

export const imageTypes = [".png", ".jpg", ".jpeg", ".gif", ".svg", ".tiff", ".webp"];
