import type { ReactNode } from 'react'
import { useConfig } from '../../hooks/useConfig.js'
import type { Source } from '../../lib/sources/types.js'
import { cn } from '../../lib/utils.js'
import styles from './Breadcrumb.module.css'

interface BreadcrumbProps {
  source: Source,
  children?: ReactNode
}

/**
 * Breadcrumb navigation
 */
export default function Breadcrumb({ source, children }: BreadcrumbProps) {
  const { routes, customClass } = useConfig()

  return <nav className={cn(styles.breadcrumb, customClass?.breadcrumb)}>
    <div className={cn(styles.path, customClass?.path)}>
      {source.sourceParts.map((part, depth) =>
        <a href={routes?.getSourceRouteUrl?.({ sourceId: part.sourceId }) ?? ''} key={depth}>{part.text}</a>
      )}
    </div>
    {children}
  </nav>
}
