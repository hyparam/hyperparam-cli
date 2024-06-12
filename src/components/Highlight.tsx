import hljs from 'highlight.js'
import javascript from 'highlight.js/lib/languages/javascript'
import React, { useEffect, useRef } from 'react'
import 'highlight.js/styles/atom-one-dark.css'

hljs.registerLanguage('javascript', javascript)

interface HighlightProps {
  text: string
}

export default function Highlight({ text }: HighlightProps) {
  const codeRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (codeRef.current && text) {
      hljs.highlightElement(codeRef.current)
    }
  }, [text])

  return (
    <pre>
      <code ref={codeRef} className="language-javascript">
        {text}
      </code>
    </pre>
  )
}
