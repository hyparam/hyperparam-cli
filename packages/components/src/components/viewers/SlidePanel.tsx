import React, { ReactNode, useEffect, useState } from 'react'

export interface SlidePanelConfig {
  slidePanel?: {
    minWidth?: number
    maxWidth?: number
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
  MIN: 200,
  MAX: 800,
  DEFAULT: 400,
} as const

/**
 * Slide out panel component with resizing.
 */
export default function SlidePanel({
  mainContent, panelContent, isPanelOpen, config,
}: SlidePanelProps) {
  const minWidth = config?.slidePanel?.minWidth && config.slidePanel.minWidth > 0 ? config.slidePanel.minWidth : WIDTH.MIN
  const maxWidth = config?.slidePanel?.maxWidth && config.slidePanel.maxWidth >= minWidth ? config.slidePanel.maxWidth : WIDTH.MAX
  function validWidth(width?: number): number | undefined {
    if (width && minWidth <= width && width <= maxWidth) {
      return width
    }
    return undefined
  }
  const defaultWidth = validWidth(config?.slidePanel?.defaultWidth) ?? validWidth(WIDTH.DEFAULT) ?? (maxWidth + minWidth) / 2
  const [panelWidth, setPanelWidth] = useState(defaultWidth)
  const [resizingClientX, setResizingClientX] = useState(-1)

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (resizingClientX === -1) return

      // Calculate new width based on mouse position
      const delta = resizingClientX - e.clientX
      setPanelWidth(Math.max(minWidth, Math.min(maxWidth, delta)))
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
  }, [resizingClientX, minWidth, maxWidth])

  function handleMouseDown(e: React.MouseEvent) {
    setResizingClientX(e.clientX + panelWidth)
  }

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
        className="slidePanel"
        style={isPanelOpen ? { width: panelWidth } : undefined}
      >
        {panelContent}
      </div>
    </div>
  )
}
