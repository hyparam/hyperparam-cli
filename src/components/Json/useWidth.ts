import { useLayoutEffect, useRef, useState } from 'react'

const defaultWidth = 320

export function useWidth<T extends HTMLElement = HTMLElement>() {
  const [width, setWidth] = useState(defaultWidth)
  const elementRef = useRef<T>(null)

  useLayoutEffect(() => {
    function updateWidth() {
      if (elementRef.current) {
        // Get the parent container width instead of the span itself
        const container = elementRef.current.parentElement
        const containerWidth = container ? container.clientWidth : elementRef.current.clientWidth
        setWidth(containerWidth || defaultWidth)
      }
    }

    updateWidth()

    // Only use ResizeObserver if it's available
    if (typeof ResizeObserver !== 'undefined') {
      const resizeObserver = new ResizeObserver(updateWidth)
      if (elementRef.current?.parentElement) {
        resizeObserver.observe(elementRef.current.parentElement)
      }

      return () => {
        resizeObserver.disconnect()
      }
    }
  }, [])

  return { elementRef, width }
}
