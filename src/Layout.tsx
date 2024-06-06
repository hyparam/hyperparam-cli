import React, { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
  className?: string
  error?: Error
  title?: string
}

/**
 * Layout for shared UI.
 * Content div style can be overridden by className prop.
 *
 * @param {Object} props
 * @param {ReactNode} props.children - content to display inside the layout
 * @param {string} props.className - additional class names to apply to the content container
 * @param {Error} props.error - error message to display
 * @param {string} props.title - page title
 * @returns rendered layout component
 */
export default function Layout({ children, className, error, title }: LayoutProps) {
  const errorMessage = error?.toString()
  if (error) console.error(error)

  return <>
    <head>
      <title>{title ? `${title} - hyperparam` : 'hyperparam'}</title>
      <meta content="hyperparam is the missing UI for machine learning" name="description" />
      <meta content="width=device-width, initial-scale=1" name="viewport" />
      <link href="/favicon.png" rel="icon" />
    </head>
    <main className='main'>
      <Sidebar />
      <div className='content-container'>
        <div className={cn('content', className)}>
          {children}
        </div>
        <div className={cn('error-bar', error && 'show-error')}>{errorMessage}</div>
      </div>
    </main>
  </>
}

function Sidebar() {
  return (
    <nav className='nav'>
      <ul>
        <li>
          <a className="brand" href='/'>
            <img
              alt="hyperparam"
              height={26}
              src="/public/logo.svg"
              width={26} />
            hyperparam
          </a>
        </li>
      </ul>
    </nav>
  )
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
