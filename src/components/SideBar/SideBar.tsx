import { useConfig } from '../../hooks/useConfig.js'
import { cn } from '../../lib/utils.js'
import styles from './SideBar.module.css'

export default function SideBar() {
  const { customClass } = useConfig()
  return <nav className={cn(styles.sideBar, customClass?.sideBar)}>
    <div>
      <a className={cn(styles.brand, customClass?.brand)} href='/'>hyperparam</a>
    </div>
  </nav>
}
