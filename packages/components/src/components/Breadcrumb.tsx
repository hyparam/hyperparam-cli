import type { ReactNode } from 'react'
import type { RoutesConfig } from '../lib/routes.js'
import type { Source } from '../lib/sources/types.js'

export type BreadcrumbConfig = RoutesConfig
interface BreadcrumbProps {
  source: Source,
  config?: BreadcrumbConfig
  children?: ReactNode
}

/**
 * Breadcrumb navigation
 */
export default function Breadcrumb({ source, config, children }: BreadcrumbProps) {
  return <nav className='top-header top-header-divided'>
    <div className='path'>
      {source.sourceParts.map((part, depth) =>
        <a href={config?.routes?.getSourceRouteUrl?.({ sourceId: part.sourceId }) ?? ''} key={depth}>{part.text}</a>,
      )}
    </div>
    {children}
  </nav>
}
