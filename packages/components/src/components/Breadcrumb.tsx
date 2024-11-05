interface BreadcrumbProps {
  file: string;
}

/**
 * Breadcrumb navigation
 */
export default function Breadcrumb({ file }: BreadcrumbProps) {
  const path = file.split('/')
  const fileName = path.at(-1)
  const isUrl = file.startsWith('http://') || file.startsWith('https://')
  
  return <nav className='top-header'>
    <div className='path'>
      {isUrl &&
        <a href={`/files?key=${file}`}>{file}</a>
      }
      {!isUrl && <>
        <a href='/files'>/</a>
        {file && file.split('/').slice(0, -1).map((sub, depth) =>
          <a href={`/files?key=${path.slice(0, depth + 1).join('/')}/`} key={depth}>{sub}/</a>
        )}
        <a href={`/files?key=${file}`}>{fileName}</a>
      </>}
    </div>
  </nav>
}