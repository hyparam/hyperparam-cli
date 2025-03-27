import { CSSProperties, useState } from 'react'
import { useConfig } from '../hooks/useConfig.js'
import { cn } from '../lib/utils.js'
import styles from '../styles/ErrorBar.module.css'

interface ErrorBarProps {
  error?: Error
}

export default function ErrorBar({ error }: ErrorBarProps) {
  const [showError, setShowError] = useState(error !== undefined)
  const [prevError, setPrevError] = useState(error)
  const { customClass } = useConfig()

  if (error) console.error(error)
  /// Reset error visibility when error prop changes
  if (error !== prevError) {
    setPrevError(error)
    setShowError(error !== undefined)
  }

  return <div
    className={cn(styles.errorBar, customClass?.errorBar)}
    style={{ '--error-bar-visibility': showError ? 'visible' : 'hidden' } as CSSProperties}
  >
    <div>
      <span>{error?.toString()}</span>
      <button
        aria-label='Close error message'
        onClick={() => { setShowError(false) }}>
        &times;
      </button>
    </div>
  </div>
}
