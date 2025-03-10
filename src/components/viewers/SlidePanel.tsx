import React, { ReactNode, useCallback, useEffect, useState } from 'react'

export interface SlidePanelConfig {
  slidePanel?: {
    minWidth?: number
    defaultWidth?: number
  }
}

interface SlidePanelProps {
  mainContent: ReactNode
  panelContent: ReactNode
  isPanelOpen: boolean
  config?: SlidePanelConfig
}

const WIDTH = {
  MIN: 100,
  DEFAULT: 400,
} as const

/**
 * Slide out panel component with resizing.
 */
export default function SlidePanel({
  mainContent, panelContent, isPanelOpen, config,
}: SlidePanelProps) {
  const minWidth = config?.slidePanel?.minWidth && config.slidePanel.minWidth > 0 ? config.slidePanel.minWidth : WIDTH.MIN
  function validWidth(width?: number): number | undefined {
    if (width && minWidth <= width) {
      return width
    }
    return undefined
  }
  const defaultWidth = validWidth(config?.slidePanel?.defaultWidth) ?? WIDTH.DEFAULT
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

  return (
    <div className="slideContainer">
      <div className="slideMain">
        {mainContent}
      </div>
      {isPanelOpen &&
        <div
          className="resizer"
          onMouseDown={handleMouseDown}
        />
      }
      <div
        className={resizingClientX === -1 ? 'slidePanel' : 'slidePanel slideDragging'}
        ref={panelRef}
        style={isPanelOpen ? { width: panelWidth } : undefined}
      >
        {panelContent}
      </div>
    </div>
  )
}
