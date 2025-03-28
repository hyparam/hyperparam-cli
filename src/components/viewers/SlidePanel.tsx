import React, { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { useConfig } from '../../hooks/useConfig.js'
import { cn } from '../../lib/utils.js'
import styles from '../../styles/viewers/SlidePanel.module.css'

interface SlidePanelProps {
  mainContent: ReactNode
  panelContent: ReactNode
  isPanelOpen: boolean
}

const WIDTH = {
  MIN: 100,
  DEFAULT: 400,
} as const

/**
 * Slide out panel component with resizing.
 */
export default function SlidePanel({ mainContent, panelContent, isPanelOpen }: SlidePanelProps) {
  const { slidePanel, customClass } = useConfig()
  const minWidth = slidePanel?.minWidth && slidePanel.minWidth > 0 ? slidePanel.minWidth : WIDTH.MIN
  function validWidth(width?: number): number | undefined {
    if (width && minWidth <= width) {
      return width
    }
    return undefined
  }
  const defaultWidth = validWidth(slidePanel?.defaultWidth) ?? WIDTH.DEFAULT
  const [resizingClientX, setResizingClientX] = useState(-1)
  const panelRef = React.createRef<HTMLDivElement>()

  // Load initial panel width from localStorage if available
  const [panelWidth, setPanelWidth] = useState<number>(() => {
    const savedWidth = typeof window !== 'undefined' ? localStorage.getItem('panelWidth') : null
    const parsedWidth = savedWidth ? parseInt(savedWidth, 10) : NaN
    return !isNaN(parsedWidth) ? parsedWidth : defaultWidth
  })

  useEffect(() => {
    // Persist panelWidth to localStorage
    localStorage.setItem('panelWidth', panelWidth.toString())
  }, [panelWidth])

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (resizingClientX === -1) return

      // Calculate new width based on mouse position
      setPanelWidth(Math.max(minWidth, resizingClientX - e.clientX))
    }

    function handleMouseUp() {
      if (resizingClientX !== -1) {
        setResizingClientX(-1)
      }
    }

    if (resizingClientX !== -1) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [resizingClientX, minWidth])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (panelRef.current && panelRef.current.offsetWidth < panelWidth) {
      setPanelWidth(panelRef.current.offsetWidth)
      setResizingClientX(e.clientX + panelRef.current.offsetWidth)
    } else {
      setResizingClientX(e.clientX + panelWidth)
    }
  }, [panelRef, panelWidth])

  const panelWidthStyle = useMemo(() => {
    return isPanelOpen ? { width: `${panelWidth}px` } : undefined
  }, [panelWidth, isPanelOpen])

  return (
    <div className={cn(styles.slidePanel, customClass?.slidePanel)}>
      <article>
        {mainContent}
      </article>
      {isPanelOpen &&
        <div
          role="separator"
          aria-orientation="vertical"
          onMouseDown={handleMouseDown}
        />
      }
      <aside
        ref={panelRef}
        data-resizing={resizingClientX !== -1}
        style={panelWidthStyle}
      >
        {panelContent}
      </aside>
    </div>
  )
}
