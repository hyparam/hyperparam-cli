import { cn } from '../lib/utils.js'
import styles from '../styles/SideBar.module.css'

export interface SideBarConfig {
  sideBar?: {
    className?: string
  },
  brand?: {
    className?: string
  }
}

interface SideBarProps {
  config?: SideBarConfig
}

export default function SideBar({ config }: SideBarProps) {
  return <nav className={cn(styles.sideBar, config?.sideBar?.className)}>
    <div>
      <a className={cn(styles.brand, config?.brand?.className)} href='/'>hyperparam</a>
    </div>
  </nav>
}
