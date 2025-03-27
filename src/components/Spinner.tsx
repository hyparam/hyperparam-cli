import { useConfig } from '../hooks/useConfig.js'
import { cn } from '../lib/utils.js'
import styles from '../styles/Spinner.module.css'

export default function Spinner() {
  const { customClass } = useConfig()
  return <div className={cn(styles.spinner, customClass?.spinner)}></div>
}
