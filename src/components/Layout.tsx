import React, { ReactNode, useEffect } from 'react'

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
  const errorMessage = error?.toString()
  if (error) console.error(error)

  useEffect(() => {
    document.title = title ? `${title} - hyperparam` : 'hyperparam'
  }, [title])

  return <main className='main'>
    <Sidebar />
    <div className='content-container'>
      <div className={cn('content', className)}>
        {children}
      </div>
      <div className={cn('error-bar', error && 'show-error')}>{errorMessage}</div>
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

/**
 * Helper function to join class names
 */
export function cn(...names: (string | undefined | false)[]): string {
  return names.filter(n => n).join(' ')
}

export function Spinner({ className }: { className: string }) {
  return <div className={cn('spinner', className)}></div>
}
