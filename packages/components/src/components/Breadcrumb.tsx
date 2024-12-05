import { RoutesConfig } from '../lib/routes.js'
import { Source } from '../lib/sources/types.js'

export type BreadcrumbConfig = RoutesConfig
interface BreadcrumbProps {
  source: Source,
  config?: BreadcrumbConfig
}

/**
 * Breadcrumb navigation
 */
export default function Breadcrumb({ source, config }: BreadcrumbProps) {
  return <nav className='top-header'>
    <div className='path'>
      {source.sourceParts.map((part, depth) =>
        <a href={config?.routes?.getSourceRouteUrl?.({ sourceId: part.sourceId }) ?? ''} key={depth}>{part.text}</a>,
      )}
    </div>
  </nav>
}
