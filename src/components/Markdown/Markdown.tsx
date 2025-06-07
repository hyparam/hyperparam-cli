import { ReactNode, createElement } from 'react'

interface MarkdownProps {
  text: string
  className?: string
}

type Token =
  | { type: 'text', content: string }
  | { type: 'bold', children: Token[] }
  | { type: 'italic', children: Token[] }
  | { type: 'code', content: string }
  | { type: 'link', href: string, children: Token[] }
  | { type: 'image', alt: string, src: string }
  | { type: 'paragraph', children: Token[] }
  | { type: 'heading', level: number, children: Token[] }
  | { type: 'list', ordered: boolean, items: Token[][] }
  | { type: 'blockquote', children: Token[] }
  | { type: 'codeblock', language?: string, content: string }
  | { type: 'hr' }

function parseMarkdown(text: string): Token[] {
  const tokens: Token[] = []
  const lines = text.split('\n')
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Skip blank lines
    if (line === undefined || line.trim() === '') {
      i++
      continue
    }

    // Code fence at top-level
    if (line.startsWith('```')) {
      const language = line.slice(3).trim() || undefined
      i++
      const codeLines: string[] = []
      while (i < lines.length && !lines[i]?.startsWith('```')) {
        const currentLine = lines[i]
        if (currentLine === undefined) {
          throw new Error(`Line is undefined at index ${i}.`)
        }
        codeLines.push(currentLine)
        i++
      }
      i++ // skip the closing ```
      tokens.push({ type: 'codeblock', language, content: codeLines.join('\n') })
      continue
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      tokens.push({ type: 'hr' })
      i++
      continue
    }

    // Heading
    const headingMatch = /^(#{1,6})\s+(.*)/.exec(line)
    if (headingMatch !== null) {
      if (!(1 in headingMatch) || !(2 in headingMatch)) {
        throw new Error('Missing entries in regex matches')
      }
      const level = headingMatch[1].length
      tokens.push({
        type: 'heading',
        level,
        children: parseInline(headingMatch[2]),
      })
      i++
      continue
    }

    // List (ordered or unordered)
    const listMatch = /^(\s*)([-*+–•‣◦○⚬]|\d+\.)\s+(.*)/.exec(line)
    if (listMatch !== null) {
      if (!(1 in listMatch) || !(2 in listMatch)) {
        throw new Error('Missing entries in regex matches')
      }
      const baseIndent = listMatch[1].length
      const ordered = /^\d+\./.test(listMatch[2])
      const [items, newIndex] = parseList(lines, i, baseIndent)
      tokens.push({ type: 'list', ordered, items })
      i = newIndex
      continue
    }

    // Blockquote
    if (line.startsWith('>')) {
      const quoteLines: string[] = []
      while (i < lines.length && lines[i]?.startsWith('>')) {
        const line = lines[i]
        if (line === undefined) {
          throw new Error(`Index ${i} not found in lines`)
        }
        quoteLines.push(line.replace(/^>\s?/, ''))
        i++
      }
      tokens.push({
        type: 'blockquote',
        children: parseMarkdown(quoteLines.join('\n')),
      })
      continue
    }

    // Paragraph
    const paraLines: string[] = []
    while (i < lines.length) {
      const ln = lines[i]
      if (ln === undefined) throw new Error(`Index ${i} not found in lines`)

      // stop if we hit a blank line or something that starts its own block
      if (!ln.trim()) break
      if (ln.startsWith('```')) break // code block
      if (ln.startsWith('>')) break // blockquote
      if (/^(#{1,6})\s+/.test(ln)) break // heading
      if (/^(\s*)([-*+–•‣◦○⚬]|\d+\.)\s+/.test(ln)) break // list item
      if (/^---+$/.test(ln.trim())) break // horizontal rule

      paraLines.push(ln)
      i++
    }
    tokens.push({
      type: 'paragraph',
      children: parseInline(paraLines.join(' ')),
    })
  }

  return tokens
}

function parseList(lines: string[], start: number, baseIndent: number): [Token[][], number] {
  const items: Token[][] = []
  let i = start

  while (i < lines.length) {
    const line = lines[i]

    // End of list if blank line or no more lines
    if (line === undefined || line.trim() === '') {
      i++
      continue
    }

    // This matches a new top-level bullet/number for the list
    const match = /^(\s*)([-*+–•‣◦○⚬]|\d+\.)\s+(.*)/.exec(line)
    // If we don't find a bullet/number at the same indent, break out
    if (match === null || !(1 in match) || match[1].length !== baseIndent || !(3 in match)) {
      break
    }

    // Begin a new list item: an array of block tokens
    const itemTokens: Token[] = []
    // Add the first line content directly without paragraph wrapper
    const content = match[3]
    if (content.trim()) {
      // Use inline tokens directly without paragraph wrapper
      itemTokens.push(...parseInline(content))
    }
    i++

    // Now parse subsequent indented lines as sub-items or sub-blocks
    while (i < lines.length) {
      const subline = lines[i]
      if (subline === undefined || subline.trim() === '') {
        i++
        continue
      }
      const subIndent = subline.search(/\S/)
      if (subIndent > baseIndent) {
        const trimmed = subline.trimStart()
        if (trimmed.startsWith('```')) {
          // If it’s a fenced code block, parse until closing fence
          const language = trimmed.slice(3).trim() || undefined
          i++
          const codeLines: string[] = []
          while (i < lines.length && !lines[i]?.trimStart().startsWith('```')) {
            const line = lines[i]
            if (line === undefined) {
              throw new Error(`Line is undefined at index ${i}`)
            }
            codeLines.push(line)
            i++
          }
          i++ // skip the closing ```
          itemTokens.push({
            type: 'codeblock',
            language,
            content: codeLines.join('\n'),
          })
          continue
        }

        // Check for nested list
        const sublistMatch = /^(\s*)([-*+–•‣◦○⚬]|\d+\.)\s+(.*)/.exec(subline)
        if (sublistMatch && 1 in sublistMatch && sublistMatch[1].length > baseIndent && 2 in sublistMatch) {
          const newBaseIndent = sublistMatch[1].length
          const ordered = /^\d+\./.test(sublistMatch[2])
          const [subItems, newIndex] = parseList(lines, i, newBaseIndent)
          itemTokens.push({ type: 'list', ordered, items: subItems })
          i = newIndex
        } else {
          // Otherwise, additional paragraph in the same list item
          itemTokens.push({
            type: 'paragraph',
            children: parseInline(subline.trim()),
          })
          i++
        }
      } else {
        // Not further-indented => break sub-block parsing for this item
        break
      }
    }

    items.push(itemTokens)
  }

  return [items, i]
}

function tokensToString(tokens: Token[]): string {
  return tokens
    .map(token => {
      switch (token.type) {
        case 'text':
          return token.content
        case 'bold':
        case 'italic':
        case 'link':
          return tokensToString(token.children)
        default:
          return ''
      }
    })
    .join('')
}

function parseInline(text: string): Token[] {
  const [tokens] = parseInlineRecursive(text)
  return tokens
}

function parseInlineRecursive(text: string, stop?: string): [Token[], number] {
  const tokens: Token[] = []
  let i = 0

  while (i < text.length) {
    if (stop && text.startsWith(stop, i)) {
      // validate closing delimiter
      const validClosing =
        (stop !== '_' || isClosingUnderscore(text, i)) &&
        (stop !== '*' || isClosingAsterisk(text, i))

      if (validClosing) {
        return [tokens, i]
      }
    }

    // Image: ![alt](src)
    if (text[i] === '!' && i + 1 < text.length && text[i + 1] === '[') {
      const start = i
      i += 2
      const [altTokens, consumedAlt] = parseInlineRecursive(text.slice(i), ']')
      i += consumedAlt
      if (i >= text.length || text[i] !== ']') {
        // For incomplete image syntax without closing bracket, preserve the whole text
        tokens.push({ type: 'text', content: text.slice(start, start + 2 + consumedAlt) })
        continue
      }
      i++
      if (i < text.length && text[i] === '(') {
        i++
        const endParen = text.indexOf(')', i)
        if (endParen === -1) {
          tokens.push({ type: 'text', content: text.slice(start, i) })
          continue
        }
        const src = text.slice(i, endParen).trim()
        const alt = tokensToString(altTokens)
        i = endParen + 1
        tokens.push({ type: 'image', alt, src })
        continue
      } else {
        tokens.push({ type: 'text', content: '![' })
        tokens.push(...altTokens)
        tokens.push({ type: 'text', content: ']' })
        continue
      }
    }

    // Link: [text](url)
    if (text[i] === '[') {
      const start = i
      i++
      const [linkTextTokens, consumed] = parseInlineRecursive(text.slice(i), ']')
      i += consumed
      if (i >= text.length || text[i] !== ']') {
        const startText = text[start]
        if (startText === undefined) {
          throw new Error(`Text is undefined at index ${start}`)
        }
        tokens.push({ type: 'text', content: startText })
        continue
      }
      i++ // skip ']'
      if (i < text.length && text[i] === '(') {
        i++ // skip '('
        const endParen = text.indexOf(')', i)
        if (endParen === -1) {
          // No closing ")": assume in-flight href
          const href = text.slice(i).trim()
          i = text.length // consume to EOI so loop terminates
          tokens.push({ type: 'link', href, children: linkTextTokens })
          continue
        }
        const href = text.slice(i, endParen).trim()
        i = endParen + 1
        tokens.push({
          type: 'link',
          href,
          children: linkTextTokens,
        })
        continue
      } else {
        tokens.push({ type: 'text', content: '[' })
        tokens.push(...linkTextTokens)
        tokens.push({ type: 'text', content: ']' })
        continue
      }
    }

    // Inline code
    if (text[i] === '`') {
      i++
      let code = ''
      while (i < text.length && text[i] !== '`') {
        const character = text[i]
        if (character === undefined) {
          throw new Error(`Character is undefined at index ${i}`)
        }
        code += character
        i++
      }
      i++
      tokens.push({ type: 'code', content: code })
      continue
    }

    // Bold (** or __)
    if (text.startsWith('**', i) || text.startsWith('__', i)) {
      const delimiter = text.slice(i, i + 2)
      i += 2
      const [innerTokens, consumed] = parseInlineRecursive(text.slice(i), delimiter)
      i += consumed
      i += 2
      tokens.push({ type: 'bold', children: innerTokens })
      continue
    }

    // Italic opener: "*" when left-flanking, "_" only when isOpeningUnderscore
    if (
      text[i] === '*' && isOpeningAsterisk(text, i) ||
      text[i] === '_' && isOpeningUnderscore(text, i)
    ) {
      const delimiter = text[i]

      // look ahead for the rest of the text
      const rest = text.slice(i + 1)
      const [innerTokens, consumed] = parseInlineRecursive(rest, delimiter)

      if (consumed < rest.length) {
        // we found a real closing delimiter
        tokens.push({ type: 'italic', children: innerTokens })
        // skip open, inner content, and closing
        i += 1 + consumed + 1
      } else if (delimiter) {
        // no closing delimiter — just emit a literal underscore/star
        tokens.push({ type: 'text', content: delimiter })
        i += 1
      }
      continue
    }

    // Otherwise, consume plain text until next special character or end
    let j = i
    while (
      j < text.length &&
      text[j] !== '`' &&
      !(text.startsWith('**', j) || text.startsWith('__', j)) &&
      text[j] !== '*' &&
      !(text[j] === '_' && isOpeningUnderscore(text, j)) &&
      text[j] !== '[' &&
      !(stop &&
        text.startsWith(stop, j) &&
        (stop !== '_' || isClosingUnderscore(text, j)) &&
        (stop !== '*' || isClosingAsterisk(text, j))) &&
      !(text[j] === '!' && j + 1 < text.length && text[j + 1] === '[')
    ) {
      j++
    }

    if (j === i) {
      // didn't consume anything – treat the single char literally
      tokens.push({ type: 'text', content: text[i] ?? '' })
      i++
    } else {
      tokens.push({ type: 'text', content: text.slice(i, j) })
      i = j
    }
  }

  return [tokens, i]
}

function isOpeningUnderscore(text: string, pos: number): boolean {
  const prev = text[pos - 1] ?? '\n'
  const next = text[pos + 1] ?? '\n'
  // can open only if next isn't whitespace, and prev isn't alnum
  return !/\s/.test(next) && !/\w/.test(prev)
}
function isClosingUnderscore(text: string, pos: number): boolean {
  const prev = text[pos - 1] ?? '\n'
  const next = text[pos + 1] ?? '\n'
  // can close only if prev isn't whitespace, and next isn't alnum
  return !/\s/.test(prev) && !/\w/.test(next)
}

function isOpeningAsterisk(text: string, pos: number): boolean {
  const next = text[pos + 1] ?? '\n'
  return !/\s/.test(next) // next char is not whitespace
}
function isClosingAsterisk(text: string, pos: number): boolean {
  const prev = text[pos - 1] ?? '\n'
  return !/\s/.test(prev) // prev char is not whitespace
}

function renderTokens(tokens: Token[], keyPrefix = ''): ReactNode[] {
  return tokens.map((token, index) => {
    const key = `${keyPrefix}${index}`
    switch (token.type) {
      case 'text':
        return token.content
      case 'code':
        return createElement('code', { key }, token.content)
      case 'bold':
        return createElement(
          'strong',
          { key },
          renderTokens(token.children, key + '-')
        )
      case 'italic':
        return createElement(
          'em',
          { key },
          renderTokens(token.children, key + '-')
        )
      case 'link':
        return createElement(
          'a',
          { key, href: token.href },
          renderTokens(token.children, key + '-')
        )
      case 'image':
        return createElement('img', {
          key,
          src: token.src,
          alt: token.alt,
        })
      case 'paragraph':
        return createElement(
          'p',
          { key },
          renderTokens(token.children, key + '-')
        )
      case 'heading':
        return createElement(
          `h${token.level}`,
          { key },
          renderTokens(token.children, key + '-')
        )
      case 'list': {
        const ListTag = token.ordered ? 'ol' : 'ul'
        return createElement(
          ListTag,
          { key },
          token.items.map((item, i) =>
            createElement(
              'li',
              { key: `${key}-${i}` },
              renderTokens(item, `${key}-${i}`)
            )
          )
        )
      }
      case 'blockquote':
        return createElement(
          'blockquote',
          { key },
          renderTokens(token.children, key + '-')
        )
      case 'codeblock':
        return createElement(
          'pre',
          { key },
          createElement('code', null, token.content)
        )
      case 'hr':
        return createElement('hr', { key })
      default:
        return null
    }
  })
}

export default function Markdown({ text, className }: MarkdownProps) {
  const tokens = parseMarkdown(text)
  return createElement('div', { className }, renderTokens(tokens))
}
