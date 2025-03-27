import { ReactNode, useEffect, useState } from 'react'
import { cn } from '../lib/utils.js'
import SideBar, { SideBarConfig } from './SideBar.js'
import Welcome, { WelcomeConfig } from './Welcome.js'

export type LayoutConfig = WelcomeConfig & SideBarConfig

interface LayoutProps {
  children: ReactNode
  className?: string
  progress?: number
  error?: Error
  title?: string
  config?: LayoutConfig
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
 * @param props.config - configuration for the layout
 */
export default function Layout({ children, className, progress, error, title, config }: LayoutProps) {
  const [showWelcome, setShowWelcome] = useState(false)

  // Check localStorage on mount to see if the user has seen the welcome popup
  useEffect(() => {
    const dismissed = localStorage.getItem('welcome:dismissed') === 'true'
    setShowWelcome(!dismissed)
  }, [])

  // Handle closing the welcome popup
  function handleCloseWelcome() {
    setShowWelcome(false)
    localStorage.setItem('welcome:dismissed', 'true')
  }

  // Update title
  useEffect(() => {
    document.title = title ? `${title} - hyperparam` : 'hyperparam'
  }, [title])

  return <main className='main'>
    <SideBar config={config} />
    <div className='content-container'>
      <div className={cn('content', className)}>
        {children}
      </div>
      <ErrorBar error={error}></ErrorBar>
    </div>
    {progress !== undefined && progress < 1 &&
      <div className={'progress-bar'} role='progressbar'>
        <div style={{ width: `${100 * progress}%` }} />
      </div>
    }
    {showWelcome && <Welcome onClose={handleCloseWelcome} config={config}/>}
  </main>
}

export function Spinner({ className }: { className?: string }) {
  return <div className={cn('spinner', className)}></div>
}

export function ErrorBar({ error }: { error?: Error }) {
  const [showError, setShowError] = useState(error !== undefined)
  const [prevError, setPrevError] = useState(error)

  if (error) console.error(error)
  /// Reset error visibility when error prop changes
  if (error !== prevError) {
    setPrevError(error)
    setShowError(error !== undefined)
  }

  return <div className={cn('error-bar', showError && 'show-error')}>
    <div className='error-content'>
      <span>{error?.toString()}</span>
      <button
        aria-label='Close error message'
        className='close-button'
        onClick={() => { setShowError(false) }}>
      &times;
      </button>
    </div>
  </div>
}
