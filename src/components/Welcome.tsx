import { MouseEvent, useEffect } from 'react'

interface WelcomePopupProps {
  onClose: () => void
}

/**
 * Welcome popup component shown to first-time users.
 * Clicking outside the popup or pressing Escape will dismiss it.
 */
export default function Welcome({ onClose }: WelcomePopupProps) {
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
    <div className="welcome" onClick={handleBackdropClick}>
      <div>
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
        <button onClick={onClose}>
          Got it
        </button>
      </div>
    </div>
  )
}
