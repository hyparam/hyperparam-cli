import { ReactNode, useEffect, useState } from 'react'
import { cn } from '../lib/utils.js'
import ErrorBar from './ErrorBar.js'
import ProgressBar from './ProgressBar.js'
import SideBar from './SideBar.js'
import Welcome from './Welcome.js'

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
    <SideBar />
    <div className='content-container'>
      <div className={cn('content', className)}>
        {children}
      </div>
      <ErrorBar error={error}></ErrorBar>
    </div>
    {progress !== undefined && progress < 1 && <ProgressBar value={progress} />}
    {showWelcome && <Welcome onClose={handleCloseWelcome} />}
  </main>
}
