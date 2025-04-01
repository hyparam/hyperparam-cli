import { HTMLAttributes } from 'react'
import styles from './VisuallyHidden.module.css'

export default function VisuallyHidden({ children, ...delegated }: HTMLAttributes<HTMLElement>) {
  return <div className={styles.wrapper} {...delegated}>{children}</div>
};
