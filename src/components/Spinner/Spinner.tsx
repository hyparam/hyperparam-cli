import { useConfig } from '../../hooks/useConfig.js'
import { cn } from '../../lib/utils.js'
import VisuallyHidden from '../VisuallyHidden/VisuallyHidden.js'
import styles from './Spinner.module.css'

export default function Spinner({ text }: {text?: string}) {
  const { customClass } = useConfig()
  const spinnerText = text ?? 'Loading...'
  return <div
    className={cn(styles.spinner, customClass?.spinner)}
    role='status'
    aria-live='polite'
  ><VisuallyHidden>{spinnerText}</VisuallyHidden></div>
}
