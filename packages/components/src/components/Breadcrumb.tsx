import { FileKey, UrlKey } from '../lib/key.js'

interface BreadcrumbProps {
  parsedKey: UrlKey | FileKey
}

function UrlBreadcrumb({ urlKey }: { urlKey: UrlKey}) {
  return <nav className='top-header'>
    <div className='path'>
      <a href={`/files?key=${urlKey.raw}`}>{urlKey.raw}</a>
    </div>
  </nav>
}

function FileBreadcrumb({ fileKey }: { fileKey: FileKey}) {
  const path = fileKey.raw.split('/')

  return <nav className='top-header'>
    <div className='path'>
      <a href='/files'>/</a>
      {path.slice(0, -1).map((sub, depth) =>
        <a href={`/files?key=${path.slice(0, depth + 1).join('/')}/`} key={depth}>{sub}/</a>,
      )}
      <a href={`/files?key=${fileKey.raw}`}>{fileKey.fileName}</a>
    </div>
  </nav>
}

/**
 * Breadcrumb navigation
 */
export default function Breadcrumb({ parsedKey }: BreadcrumbProps) {
  if (parsedKey.kind === 'url') {
    return <UrlBreadcrumb urlKey={parsedKey} />
  }
  return <FileBreadcrumb fileKey={parsedKey} />
}
