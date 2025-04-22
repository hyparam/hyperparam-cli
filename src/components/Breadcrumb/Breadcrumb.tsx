import type { ReactNode } from 'react'
import { useConfig } from '../../hooks/useConfig.js'
import type { Source } from '../../lib/sources/types.js'
import { Version } from '../../lib/sources/types.js'
import { cn } from '../../lib/utils.js'
import Dropdown from '../Dropdown/Dropdown.js'
import styles from './Breadcrumb.module.css'

interface BreadcrumbProps {
  source: Source,
  children?: ReactNode
}

function Versions({ versions, label }: { versions: Version[], label: string }) {
  const { routes, customClass } = useConfig()

  return <Dropdown label={label} className={customClass?.versions}>
    {versions.map(({ label, sourceId }) => {
      return <a key={sourceId} role="menuitem" href={routes?.getSourceRouteUrl?.({ sourceId })}>{label}</a>
    })}
  </Dropdown>
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
    {source.versions && <Versions label={source.versions.label} versions={source.versions.versions} />}
    {children}
  </nav>
}
