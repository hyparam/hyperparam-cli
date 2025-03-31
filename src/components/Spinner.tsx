import { useConfig } from '../hooks/useConfig.js'
import { cn } from '../lib/utils.js'
import styles from '../styles/Spinner.module.css'
import VisuallyHidden from './VisuallyHidden.js'

export default function Spinner({ text }: {text?: string}) {
  const { customClass } = useConfig()
  const spinnerText = text ?? 'Loading...'
  return <div
    className={cn(styles.spinner, customClass?.spinner)}
    role='status'
    aria-live='polite'
  ><VisuallyHidden>{spinnerText}</VisuallyHidden></div>
}
