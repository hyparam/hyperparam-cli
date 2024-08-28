import React from 'react'
import { ReactNode } from 'react'

interface MarkdownProps {
  className?: string
  text: string
}

export default function Markdown({ text, className }: MarkdownProps) {
  function parseMarkdown(markdown: string): ReactNode {
    const elements: ReactNode[] = []
    const lines = markdown.split('\n')

    let inCodeBlock = false
    let codeBlock: string[] = []

    let inList = false
    let listItems: ReactNode[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // Code blocks
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          elements.push(<pre key={`code-${i}`}>{codeBlock.join('\n')}</pre>)
          inCodeBlock = false
          codeBlock = []
        } else {
          inCodeBlock = true
        }
        continue
      }
      if (inCodeBlock) {
        codeBlock.push(line)
        continue
      }

      // Bold
      if (line.includes('**')) {
        const parts = line.split('**')
        elements.push(
          <p key={i}>
            {parts.map((part, index) => index % 2 ? <strong key={index}>{part}</strong> : part)}
          </p>
        )
        continue
      }

      // Italic
      if (line.includes('*')) {
        const parts = line.split('*')
        elements.push(
          <p key={i}>
            {parts.map((part, index) => index % 2 ? <em key={index}>{part}</em> : part)}
          </p>
        )
        continue
      }

      // Headers
      if (line.startsWith('#')) {
        const level = line.split(' ')[0].length
        const text = line.slice(level + 1)
        const HeaderTag = `h${level}` as keyof JSX.IntrinsicElements
        elements.push(<HeaderTag key={i}>{text}</HeaderTag>)
        continue
      }

      // Images
      const imageMatch = line.match(/!\[(.*?)\]\((.*?)\)/)
      if (imageMatch) {
        const [, alt, src] = imageMatch
        elements.push(<img key={i} src={src} alt={alt} />)
        continue
      }

      // Links
      if (line.includes('[') && line.includes(']') && line.includes('(') && line.includes(')')) {
        const linkedLine = line.replace(/\[(.*?)\]\((.*?)\)/g, (match, linkText, url) => {
          return `<a href="${url}">${linkText}</a>`
        })
        elements.push(<p dangerouslySetInnerHTML={{ __html: linkedLine }} key={i}></p>)
        continue
      }

      // Lists
      if (line.startsWith('-') || line.startsWith('*') || line.startsWith('+')) {
        const listItem = line.slice(1).trim()
        listItems.push(<li key={`list-item-${i}`}>{listItem}</li>)
        inList = true
        continue
      }

      if (inList && listItems.length > 0) {
        elements.push(<ul key={`list-${i}`}>{listItems}</ul>)
        listItems = []
        inList = false
      }

      // Paragraphs
      elements.push(<p key={i}>{line}</p>)
    }

    // Flush any remaining code block
    if (inCodeBlock && codeBlock.length > 0) {
      elements.push(<pre key={`code-${lines.length}`}>{codeBlock.join('\n')}</pre>)
    }

    // Flush any remaining list items
    if (inList && listItems.length > 0) {
      elements.push(<ul key={`list-${lines.length}`}>{listItems}</ul>)
    }

    return <div className={className}>{elements}</div>
  }

  return parseMarkdown(text)
}
