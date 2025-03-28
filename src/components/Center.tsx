import { ReactNode } from 'react'
import { useConfig } from '../hooks/useConfig.js'
import { cn } from '../lib/utils.js'
import styles from '../styles/Center.module.css'

export default function Center({ children }: {children?: ReactNode}) {
  const { customClass } = useConfig()
  return <div className={cn(styles.center, customClass?.center)}>{children}</div>
}
