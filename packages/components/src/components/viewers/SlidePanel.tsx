import React, { ReactNode, useEffect, useState } from 'react'

interface SlidePanelProps {
  mainContent: ReactNode
  panelContent: ReactNode
  isPanelOpen: boolean
}

/**
 * Slide out panel component with resizing.
 */
export function SlidePanel({
  mainContent, panelContent, isPanelOpen,
}: SlidePanelProps) {
  const [panelWidth, setPanelWidth] = useState(400) // default width
  const [resizingClientX, setResizingClientX] = useState(-1)

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (resizingClientX === -1) return

      // Calculate new width based on mouse position
      const minWidth = 200
      const maxWidth = 800
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
  }, [resizingClientX])

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
