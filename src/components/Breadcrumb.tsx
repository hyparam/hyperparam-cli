import type { ReactNode } from 'react'
import { useConfig } from '../hooks/useConfig.js'
import type { Source } from '../lib/sources/types.js'

interface BreadcrumbProps {
  source: Source,
  children?: ReactNode
}

/**
 * Breadcrumb navigation
 */
export default function Breadcrumb({ source, children }: BreadcrumbProps) {
  const { routes } = useConfig()

  return <nav className='top-header top-header-divided'>
    <div className='path'>
      {source.sourceParts.map((part, depth) =>
        <a href={routes?.getSourceRouteUrl?.({ sourceId: part.sourceId }) ?? ''} key={depth}>{part.text}</a>
      )}
    </div>
    {children}
  </nav>
}
