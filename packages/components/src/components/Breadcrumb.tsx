import { RoutesConfig } from '../lib/routes.js'
import { Source } from '../lib/source.js'

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
      {source.getSourceParts().map((part, depth) =>
        <a href={config?.routes?.getSourceRouteUrl?.({ source: part.source }) ?? ''} key={depth}>{part.name}</a>,
      )}
    </div>
  </nav>

}
