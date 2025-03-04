export function getFileName(source: string): string {
  const fileName = source
    .replace(/\?.*$/, '') // remove query string
    .split('/')
    .at(-1)
  if (!fileName) throw new Error('Cannot extract a filename')
  return fileName
}
