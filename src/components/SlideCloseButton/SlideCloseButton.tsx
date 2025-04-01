import { MouseEventHandler } from 'react'
import { useConfig } from '../../hooks/useConfig.js'
import { cn } from '../../lib/utils.js'
import styles from './SlideCloseButton.module.css'

export default function SlideCloseButton({ onClick }: { onClick: MouseEventHandler<HTMLButtonElement> | undefined }) {
  const { customClass } = useConfig()
  return (
    <button className={ cn( styles.slideClose, customClass?.slideCloseButton ) } onClick={onClick}>&nbsp;</button>
  )
}
