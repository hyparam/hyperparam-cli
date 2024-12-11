import { ReactNode, useEffect, useState } from 'react'
import { cn } from '../lib/utils.js'

interface LayoutProps {
  children: ReactNode
  className?: string
  progress?: number
  error?: Error
  title?: string
}

/**
 * Layout for shared UI.
 * Content div style can be overridden by className prop.
 *
 * @param props
 * @param props.children - content to display inside the layout
 * @param props.className - additional class names to apply to the content container
 * @param props.progress - progress bar value
 * @param props.error - error message to display
 * @param props.title - page title
 */
export default function Layout({ children, className, progress, error, title }: LayoutProps) {
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
    document.title = title ? `${title} - hyperparam` : 'hyperparam'
  }, [title])

  return <main className='main'>
    <Sidebar />
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
  </main>
}

function Sidebar() {
  return <nav className='nav'>
    <a className="brand" href='/'>hyperparam</a>
  </nav>
}

export function Spinner({ className }: { className: string }) {
  return <div className={cn('spinner', className)}></div>
}
