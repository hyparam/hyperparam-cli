import React, { ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '../../lib/utils'
import styles from './Dropdown.module.css'

interface DropdownProps {
  label?: ReactNode
  align?: 'left' | 'right'
  className?: string
  children: ReactNode
}

/**
 * Dropdown menu component.
 *
 * @example
 * <Dropdown label="Menu">
 *   <button role="menuitem">Item 1</button>
 *   <button role="menuitem">Item 2</button>
 * </Dropdown>
 */
export default function Dropdown({ label, align = 'left', className, children }: DropdownProps) {
  const [isOpen, _setIsOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)

  const dropdownRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Helper to get all focusable items in the dropdown menu
  function getFocusableMenuItems(): HTMLElement[] {
    if (!menuRef.current) return []
    return Array.from(menuRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [role="menuitem"]'
    ))
  }

  const setIsOpen = useCallback((value: React.SetStateAction<boolean>) => {
    _setIsOpen(prev => {
      const nextIsOpen = typeof value === 'function' ? value(prev) : value
      if (nextIsOpen) {
        // reset focus so we start at the first item
        setFocusedIndex(0)
      }
      return nextIsOpen
    })
  }, [])

  function toggleDropdown() {
    setIsOpen(prev => !prev)
  }

  // whenever focusedIndex changes, focus the corresponding menu item
  useEffect(() => {
    if (isOpen && focusedIndex >= 0) {
      const items = getFocusableMenuItems()
      items[focusedIndex]?.focus()
    }
  }, [isOpen, focusedIndex])

  // handle key presses
  function handleKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    const items = getFocusableMenuItems()
    if (!items.length) return

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setFocusedIndex(prev => (prev + 1) % items.length)
        if (!isOpen) {
          setIsOpen(true)
        }
        break
      case 'ArrowUp':
        event.preventDefault()
        setFocusedIndex(prev => (prev - 1 + items.length) % items.length)
        break
      case 'Home':
        event.preventDefault()
        setFocusedIndex(0)
        break
      case 'End':
        event.preventDefault()
        setFocusedIndex(items.length - 1)
        break
      case 'Escape':
        event.preventDefault()
        setIsOpen(false)
        buttonRef.current?.focus()
        break
      default:
        break
    }
  }

  // close dropdown if user clicks outside or presses escape
  useEffect(() => {
    function handleClickInside(event: MouseEvent) {
      const target = event.target as Element
      // if a child is clicked (and it's not an input), close the dropdown
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
  }, [setIsOpen])

  return (
    <div
      className={cn(styles.dropdown, align === 'left' && styles.dropdownLeft, className)}
      ref={dropdownRef}
    >
      <button
        aria-haspopup='menu'
        aria-expanded={isOpen}
        className={styles.dropdownButton}
        onClick={toggleDropdown}
        onKeyDown={handleKeyDown}
        ref={buttonRef}>
        {label}
      </button>

      <div
        className={styles.dropdownContent}
        ref={menuRef}
        role='menu'
        onKeyDown={handleKeyDown}>
        {children}
      </div>
    </div>
  )
}
