import type { ReactNode } from 'react'

interface MarkdownProps {
  text: string
  className?: string
}

export default function Markdown({ text, className }: MarkdownProps) {
  // Inline parsing: parse bold, italic, underline, links, images, inline code
  function parseInline(str: string): ReactNode[] {
    const nodes: ReactNode[] = []

    // A helper function to safely parse inline and return an array of react nodes
    function renderTextSegments(text: string): ReactNode[] {
      let result: ReactNode[] = []

      // Process in order: image links, images, regular links, and then formatting
      const imageInsideLinkRegex = /\[!\[([^\]]*)\]\(([^)]+)\)\]\(([^)]+)\)/g
      // Handle mixed content within links: [text ![img](img_url) more text](link_url)
      const mixedContentLinkRegex = /\[([^\]]*?!\[[^\]]*?\]\([^)]+?\)[^\]]*?)\]\(([^)]+)\)/g
      const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
      const codeRegex = /`([^`]+)`/g
      const boldRegex = /\*\*([^*]+)\*\*/g
      const italicRegex = /\*(?!\s)([^*]+?)(?!\s)\*/g
      const underlineRegex = /__(.+?)__/g

      function applyRegex(
        currentText: ReactNode[],
        regex: RegExp,
        renderFn: (match: RegExpExecArray) => ReactNode
      ) {
        const newResult: ReactNode[] = []
        for (const segment of currentText) {
          if (typeof segment === 'string') {
            const str = segment
            let lastIndex = 0
            let match: RegExpExecArray | null
            regex.lastIndex = 0 // Reset regex for safety
            while ((match = regex.exec(str)) !== null) {
              // Add text before match
              if (match.index > lastIndex) {
                newResult.push(str.slice(lastIndex, match.index))
              }
              // Add replaced node
              newResult.push(renderFn(match))
              lastIndex = match.index + match[0].length
            }
            if (lastIndex < str.length) {
              newResult.push(str.slice(lastIndex))
            }
          } else {
            // If it's already a ReactNode (not a string), just push it
            newResult.push(segment)
          }
        }
        return newResult
      }

      // Start with entire text as a single segment
      result = [text]

      // Apply in a specific order to handle nested elements:
      // First handle image-inside-link pattern
      result = applyRegex(result, imageInsideLinkRegex, (m) => <a href={m[3]} key={`imglink-${m[3]}`}>
        <img alt={m[1]} src={m[2]} key={`img-in-link-${m[2]}`} />
      </a>)

      // Then handle mixed content links (with images and text)
      result = applyRegex(result, mixedContentLinkRegex, (m) => <a href={m[2]} key={`mixed-${m[2]}`}>{parseInline(m[1])}</a>)

      // Then handle regular images and links
      result = applyRegex(result, imageRegex, (m) => <img key={`img-${m[2]}`} alt={m[1]} src={m[2]} />)
      result = applyRegex(result, linkRegex, (m) => <a href={m[2]} key={`link-${m[2]}`}>{parseInline(m[1])}</a>)

      // Finally handle text formatting
      result = applyRegex(result, codeRegex, (m) => <code key={`code-${m.index}`}>{m[1]}</code>)
      result = applyRegex(result, boldRegex, (m) => <strong key={`bold-${m.index}`}>{m[1]}</strong>)
      result = applyRegex(result, italicRegex, (m) => <em key={`italic-${m.index}`}>{m[1]}</em>)
      result = applyRegex(result, underlineRegex, (m) => <u key={`underline-${m.index}`}>{m[1]}</u>)

      return result
    }

    nodes.push(...renderTextSegments(str))
    return nodes
  }

  // Block-level parsing: paragraphs, headers, lists, code blocks
  type NodeType =
    | { type: 'paragraph', content: string }
    | { type: 'header', level: number, content: string }
    | { type: 'codeblock', content: string }
    | { type: 'list', ordered: boolean, items: ListItemType[] }

  interface ListItemType {
    content: string
    children: NodeType[]
  }

  function parseBlocks(lines: string[]): NodeType[] {
    let i = 0
    const nodes: NodeType[] = []

    function parseList(startIndent: number, ordered: boolean): { node: NodeType, endIndex: number } {
      const items: ListItemType[] = []
      while (i < lines.length) {
        const line = lines[i]
        const indent = /^(\s*)/.exec(line)?.[1].length ?? 0

        // Check if line is a list item at or deeper than startIndent
        const liMatch = ordered
          ? /^\s*\d+\.\s+(.*)/.exec(line)
          : /^\s*-\s+(.*)/.exec(line)

        if (!liMatch || indent < startIndent) {
          break
        }

        const content = liMatch[1]
        i++

        // Check if next lines form sub-lists or paragraphs under this item
        const children: NodeType[] = []
        while (i < lines.length) {
          const subline = lines[i]
          const subIndent = /^(\s*)/.exec(subline)?.[1].length ?? 0
          // Check for sub-list
          const subOlMatch = /^\s*\d+\.\s+(.*)/.exec(subline)
          const subUlMatch = /^\s*-\s+(.*)/.exec(subline)
          if ((subOlMatch || subUlMatch) && subIndent > startIndent) {
            const { node: sublist, endIndex } = parseList(subIndent, !!subOlMatch)
            children.push(sublist)
            i = endIndex
          } else if (subline.trim().length === 0 || subIndent > startIndent) {
            if (subline.trim().length !== 0) {
              // paragraph under item
              children.push({ type: 'paragraph', content: subline.trim() })
            }
            i++
          } else {
            break
          }
        }

        items.push({ content, children })
      }

      return { node: { type: 'list', ordered, items }, endIndex: i }
    }

    while (i < lines.length) {
      const line = lines[i]

      // Skip blank lines
      if (line.trim() === '') {
        i++
        continue
      }

      // Check for code block
      if (line.trim().startsWith('```')) {
        i++
        const codeLines: string[] = []
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i])
          i++
        }
        i++ // skip the ending ```
        nodes.push({ type: 'codeblock', content: codeLines.join('\n') })
        continue
      }

      // Check for headers
      const headerMatch = /^(#{1,3})\s+(.*)/.exec(line)
      if (headerMatch) {
        const level = headerMatch[1].length
        const content = headerMatch[2]
        nodes.push({ type: 'header', level, content })
        i++
        continue
      }

      // Check for list item
      const olMatch = /^\s*\d+\.\s+(.*)/.exec(line)
      const ulMatch = /^\s*-\s+(.*)/.exec(line)

      if (olMatch || ulMatch) {
        const indent = /^(\s*)/.exec(line)?.[1].length ?? 0
        const ordered = !!olMatch
        const { node, endIndex } = parseList(indent, ordered)
        nodes.push(node)
        i = endIndex
        continue
      }

      // If not code block, header, or list, treat as paragraph
      nodes.push({ type: 'paragraph', content: line })
      i++
    }

    return nodes
  }

  const lines = text.split('\n')
  const ast = parseBlocks(lines)

  // Convert AST to React elements
  function renderNodes(nodes: NodeType[]): ReactNode {
    return nodes.map((node, idx) => {
      switch (node.type) {
      case 'paragraph':
        return <p key={idx}>{...parseInline(node.content)}</p>
      case 'header':
        if (node.level === 1) return <h1 key={idx}>{...parseInline(node.content)}</h1>
        if (node.level === 2) return <h2 key={idx}>{...parseInline(node.content)}</h2>
        if (node.level === 3) return <h3 key={idx}>{...parseInline(node.content)}</h3>
        return <p key={idx}>{...parseInline(node.content)}</p>
      case 'codeblock':
        return (
          <pre key={idx}>
            <code>{node.content}</code>
          </pre>
        )
      case 'list':
        if (node.ordered) {
          return (
            <ol key={idx}>
              {node.items.map((item, liIndex) => <li key={liIndex}>
                {...parseInline(item.content)}
                {renderNodes(item.children)}
              </li>)}
            </ol>
          )
        } else {
          return (
            <ul key={idx}>
              {node.items.map((item, liIndex) => <li key={liIndex}>
                {...parseInline(item.content)}
                {renderNodes(item.children)}
              </li>)}
            </ul>
          )
        }
      default:
        return null
      }
    })
  }

  return <div className={className}>{renderNodes(ast)}</div>
}
