import { useConfig } from '../../hooks/useConfig'
import { cn } from '../../lib/utils.js'
import VisuallyHidden from '../VisuallyHidden/VisuallyHidden.js'
import styles from './ProgressBar.module.css'

export default function ProgressBar({ value }: {value: number}) {
  const { customClass } = useConfig()
  if (value < 0 || value > 1) {
    throw new Error('ProgressBar value must be between 0 and 1')
  }
  const roundedValue = Math.round(value * 100) / 100
  const percentage = roundedValue.toLocaleString('en-US', { style: 'percent' })
  return (
    <div
      className={cn(styles.progressBar, customClass?.progressBar)}
      role='progressbar'
      aria-valuenow={roundedValue}
      aria-valuemin={0}
      aria-valuemax={1}
    >
      <VisuallyHidden>{percentage}</VisuallyHidden>
      <div style={{ width: percentage }} role="presentation" />
    </div>
  )
}
