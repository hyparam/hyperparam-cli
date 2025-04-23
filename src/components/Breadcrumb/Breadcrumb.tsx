import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { useConfig } from '../../hooks/useConfig.js'
import type { Source, VersionsData } from '../../lib/sources/types.js'
import { cn } from '../../lib/utils.js'
import Dropdown from '../Dropdown/Dropdown.js'
import styles from './Breadcrumb.module.css'

interface BreadcrumbProps {
  source: Source,
  children?: ReactNode
}

function Versions({ source }: { source: Source }) {
  const { routes, customClass } = useConfig()
  const [versionsData, setVersionsData] = useState<VersionsData | undefined>(undefined)

  useEffect(() => {
    source.fetchVersions?.().then(
      (nextVersionData) => {
        setVersionsData(nextVersionData)
      }
    ).catch((error: unknown) => {
      console.error('Error fetching versions:', error)
      setVersionsData(undefined)
    })
  }, [source])

  if (!versionsData) return null
  const { label, versions } = versionsData

  return <Dropdown label={label} className={cn(styles.versions, customClass?.versions)} align="right">
    {versions.map(({ label, sourceId }) => {
      return <a
        key={sourceId}
        role="menuitem"
        href={routes?.getSourceRouteUrl?.({ sourceId })}
        aria-current={sourceId === source.sourceId ? 'true' : undefined}
      >{label}</a>
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
    {source.fetchVersions && <Versions source={source} />}
    {children}
  </nav>
}
