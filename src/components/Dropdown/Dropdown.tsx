import { ReactNode, useEffect, useRef, useState } from 'react'
import { cn } from '../../lib/utils'
import styles from './Dropdown.module.css'

interface DropdownProps {
  label?: string
  align?: 'left' | 'right'
  className?: string
  children: ReactNode
}

/**
 * Dropdown menu component.
 *
 * @example
 * <Dropdown label='Menu'>
 *   <button>Item 1</button>
 *   <button>Item 2</button>
 * </Dropdown>
 */
export default function Dropdown({ label, align = 'left', className, children }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  function toggleDropdown() {
    setIsOpen(!isOpen)
  }

  useEffect(() => {
    function handleClickInside(event: MouseEvent) {
      const target = event.target as Element
      if (menuRef.current && menuRef.current.contains(target) && target.tagName !== 'INPUT') {
        setIsOpen(false)
      }
    }
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }
    document.addEventListener('click', handleClickInside)
    document.addEventListener('keydown', handleEscape)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickInside)
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div
      className={cn(styles.dropdown, align === 'left' && styles.dropdownLeft, className)}
      ref={dropdownRef}>
      <button
        className={styles.dropdownButton}
        onClick={toggleDropdown}
        aria-haspopup='menu'
        aria-expanded={isOpen}>
        {label}
      </button>
      <div className={styles.dropdownContent} ref={menuRef} role='menu'>
        {children}
      </div>
    </div>
  )
}
