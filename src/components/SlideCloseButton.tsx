import { MouseEventHandler } from 'react'
import { useConfig } from '../hooks/useConfig.js'
import { cn } from '../lib/utils.js'
import styles from '../styles/SlideCloseButton.module.css'

export default function SlideCloseButton({ onClick }: { onClick: MouseEventHandler<HTMLButtonElement> | undefined }) {
  const { customClass } = useConfig()
  return (
    <button className={ cn( styles.slideCloseButton, customClass?.slideCloseButton ) } onClick={onClick}>&nbsp;</button>
  )
}
