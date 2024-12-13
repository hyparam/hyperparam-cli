import { ErrorBar, cn } from '@hyparam/components'
import { ReactNode, useEffect } from 'react'

interface LayoutProps {
  children: ReactNode
  className?: string
  progress?: number
  error?: Error
}

/**
 * Layout for shared UI.
 * Content div style can be overridden by className prop.
 *
 * @param {Object} props
 * @param {ReactNode} props.children - content to display inside the layout
 * @param {string | undefined} props.className - additional class names to apply to the content container
 * @param {number | undefined} props.progress - progress bar value
 * @param {Error} props.error - error message to display
 * @returns {ReactNode}
 */
export default function Layout({ children, className, progress, error }: LayoutProps): ReactNode {
  // Update title
  useEffect(() => {
    document.title = 'hyparquet demo - apache parquet file viewer online'
  }, [])

  return <>
    <div className='content-container'>
      <div className={cn('content', className)}>
        {children}
      </div>
      <ErrorBar error={error} />
    </div>
    {progress !== undefined && progress < 1 &&
      <div className={'progress-bar'} role='progressbar'>
        <div style={{ width: `${100 * progress}%` }} />
      </div>
    }
  </>
}

export function Spinner({ className }: { className: string }) {
  return <div className={cn('spinner', className)}></div>
}
