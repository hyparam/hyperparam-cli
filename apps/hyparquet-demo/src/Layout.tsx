import { cn } from '@hyparam/components'
import { ReactNode, useEffect, useState } from 'react'

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
  const [showError, setShowError] = useState(false)
  const errorMessage = error?.toString()
  if (error) console.error(error)

  // Reset error visibility when error prop changes
  useEffect(() => {
    if (error) {
      setShowError(true)
      console.error(error)
    } else {
      setShowError(false)
    }
  }, [error])

  // Update title
  useEffect(() => {
    document.title = 'hyparquet demo - apache parquet file viewer online'
  }, [])

  return <>
    <div className='content-container'>
      <div className={cn('content', className)}>
        {children}
      </div>
      <div className={cn('error-bar', showError && 'show-error')}>
        <div className='error-content'>
          <span>{errorMessage}</span>
          <button
            aria-label='Close error message'
            className='close-button'
            onClick={() => { setShowError(false) }}>
            &times;
          </button>
        </div>
      </div>
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
