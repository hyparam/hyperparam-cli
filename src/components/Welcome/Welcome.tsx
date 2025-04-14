import { MouseEvent, useEffect } from 'react'
import { useConfig } from '../../hooks/useConfig.js'
import { cn } from '../../lib/utils.js'
import styles from './Welcome.module.css'

interface WelcomePopupProps {
  onClose: () => void
}

/**
 * Welcome popup component shown to first-time users.
 * Clicking outside the popup or pressing Escape will dismiss it.
 */
export default function Welcome({ onClose }: WelcomePopupProps) {
  const { customClass, welcome } = useConfig()
  // Close popup when clicking outside
  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // Close popup when pressing Escape key
  useEffect(() => {
    function handleEscKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscKey)
    return () => { window.removeEventListener('keydown', handleEscKey) }
  }, [onClose])

  return (
    <div className={cn(styles.welcome, customClass?.welcome)} onClick={handleBackdropClick}>
      <div>
        {welcome?.content ?? <>
          <h2>npx hyperparam</h2>
          <p>
          This is the <a href="https://hyperparam.app">Hyperparam</a> cli for local data viewing.
          </p>
          <p>
          This tool lets you browse and explore large datasets particularly in parquet format.
          </p>
          <p>
          Supported file types include Parquet, CSV, JSON, Markdown, and Text.
          </p>
        </>}
        <button onClick={onClose}>
          {welcome?.buttonText ?? 'Got it'}
        </button>
      </div>
    </div>
  )
}
