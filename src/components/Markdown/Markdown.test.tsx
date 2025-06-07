import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Markdown from './Markdown.js'

describe('Markdown', () => {
  it('renders plain text as a paragraph', () => {
    const { getByText } = render(<Markdown text="Hello, world!" />)
    expect(getByText('Hello, world!')).toBeDefined()
  })

  it('renders bold text', () => {
    const { getByText } = render(<Markdown text="This is **bold** text." />)
    const boldText = getByText('bold')
    expect(boldText).toBeDefined()
    expect(boldText.tagName).toBe('STRONG')
  })

  it('renders italic text', () => {
    const { getByText } = render(<Markdown text="This is *italic* text." />)
    const italicText = getByText('italic')
    expect(italicText).toBeDefined()
    expect(italicText.tagName).toBe('EM')
  })

  it('does not treat asterisks used for multiplication as italic', () => {
    const text = 'Make tool calls to compute 123123 * 3423542 and 235666 * 233333.'
    const { container, getByText } = render(<Markdown text={text} />)
    expect(getByText(text)).toBeDefined()
    expect(container.querySelector('em')).toBeNull()
  })

  it('does italicize numbers without spaces', () => {
    const text = 'Four should be italic: 3*4*5.'
    const { container, getByText } = render(<Markdown text={text} />)
    expect(getByText('4')).toBeDefined()
    expect(container.querySelector('em')).toBeDefined()
  })

  it('does not italicize snake case', () => {
    const text = 'Variables snake_post_ and mid_snake_case and _init_snake should not be italicized.'
    const { container, getByText } = render(<Markdown text={text} />)
    expect(container.innerHTML).not.toContain('<em>')
    expect(container.innerHTML).toContain('mid_snake_case')
    expect(getByText(text)).toBeDefined()
  })

  it('does italicize surrounding underscores', () => {
    const text = '_this_one_tho_'
    const { container, getByText } = render(<Markdown text={text} />)
    expect(getByText('this_one_tho')).toBeDefined()
    expect(container.querySelector('em')).toBeDefined()
  })

  it('renders single asterisks for italic', () => {
    const text = '*single asterisks*'
    const { getByText } = render(<Markdown text={text} />)
    const italicText = getByText('single asterisks')
    expect(italicText).toBeDefined()
    expect(italicText.tagName).toBe('EM')
  })

  it('renders headers', () => {
    const text = '# Heading 1\n## Heading 2\n### Heading 3'
    const { getByText } = render(<Markdown text={text} />)
    expect(getByText('Heading 1')).toBeDefined()
    expect(getByText('Heading 2')).toBeDefined()
    expect(getByText('Heading 3')).toBeDefined()
  })

  it('renders an image', () => {
    const text = '![Hyperparam logo](https://hyperparam.app/logo.png)'
    const { getByAltText } = render(<Markdown text={text} />)
    expect(getByAltText('Hyperparam logo')).toBeDefined()
  })

  it('renders a link', () => {
    const text = 'Check out [Hyp](https://hyperparam.app).'
    const { getByRole, getByText } = render(<Markdown text={text} />)
    expect(getByText('Hyp')).toBeDefined()
    expect(getByRole('link').getAttribute('href')).toBe('https://hyperparam.app')
  })

  it('renders a partial link', () => {
    const text = 'Check out [Hyp](https://hyper'
    const { getByText, queryByText } = render(<Markdown text={text} />)
    expect(getByText('Hyp')).toBeDefined()
    expect(queryByText('hyper')).toBeNull()
    expect(getByText('Hyp').tagName).toBe('A')
  })

  it('renders multiple links in one line', () => {
    const text = 'Check out [Hyp](https://hyperparam.app) on [GitHub](https://github.com/hyparam).'
    const { getAllByRole, getByText } = render(<Markdown text={text} />)
    expect(getByText('Hyp')).toBeDefined()
    expect(getByText('GitHub')).toBeDefined()
    const links = getAllByRole('link')
    expect(links[0]?.getAttribute('href')).toBe('https://hyperparam.app')
    expect(links[1]?.getAttribute('href')).toBe('https://github.com/hyparam')
  })

  it('renders blockquote', () => {
    const text = '> This is a blockquote.'
    const { getByText } = render(<Markdown text={text} />)
    expect(getByText('This is a blockquote.')).toBeDefined()
  })

  it('renders a horizontal rule', () => {
    const text = 'First paragraph\n---\nSecond paragraph'
    const { container } = render(<Markdown text={text} />)

    const paragraphs = container.querySelectorAll('p')
    expect(paragraphs.length).toBe(2)
    expect(paragraphs[0]?.textContent).toBe('First paragraph')
    expect(paragraphs[1]?.textContent).toBe('Second paragraph')

    const hr = container.querySelector('hr')
    expect(hr).toBeDefined()
  })
})

describe('Markdown code blocks', () => {
  it('renders a code block', () => {
    const text = '```js\nconsole.log(\'Hello, world!\')\n```'
    const { container } = render(<Markdown text={text} />)
    const code = container.querySelector('pre')
    expect(code).toBeDefined()
    expect(code?.textContent).toBe('console.log(\'Hello, world!\')')
  })

  it('renders an unterminated code block', () => {
    const text = '```js\nconsole.log(\'Hello, world!\')'
    const { container } = render(<Markdown text={text} />)
    const code = container.querySelector('pre')
    expect(code).toBeDefined()
    expect(code?.textContent).toBe('console.log(\'Hello, world!\')')
  })

  it('renders a bold code block', () => {
    const text = '**`Math.pow(base, exponent)`**'
    const { container, getByText } = render(<Markdown text={text} />)
    expect(getByText('Math.pow(base, exponent)')).toBeDefined()
    expect(container.innerHTML).not.toContain('**')
  })

  it('renders markdown inside a code block as literal text', () => {
    const text = `\`\`\`
**This should not be bold**
*nor italic*
\`\`\``
    const { container } = render(<Markdown text={text} />)
    const codeBlock = container.querySelector('pre')
    expect(codeBlock).toBeDefined()
    expect(codeBlock?.textContent).toContain('**This should not be bold**')
    expect(codeBlock?.textContent).toContain('*nor italic*')
    // Ensure markdown inside code block is not parsed
    expect(container.innerHTML).not.toContain('<strong>')
    expect(container.innerHTML).not.toContain('<em>')
  })
})

describe('Markdown lists', () => {
  it('renders a list', () => {
    const text = '- Item 1\n- Item 2\n- Item 3\n\n'
    const { container, getByText } = render(<Markdown text={text} />)
    expect(getByText('Item 1')).toBeDefined()
    expect(getByText('Item 2')).toBeDefined()
    expect(getByText('Item 3')).toBeDefined()
    // Should have no <p> tags for simple lists
    expect(container.querySelectorAll('p').length).toBe(0)
  })

  it('renders a list with bold', () => {
    const text = '- **Item 1**\n- Item 2\n- Item 3\n\n'
    const { getByText } = render(<Markdown text={text} />)
    expect(getByText('Item 1')).toBeDefined()
    expect(getByText('Item 2')).toBeDefined()
    expect(getByText('Item 3')).toBeDefined()
  })

  it('renders a list with indented sub-paragraphs', () => {
    const text = '- Item 1\n  Paragraph 1\n  Paragraph 2\n- Item 2\n\n'
    const { container, getByText } = render(<Markdown text={text} />)
    expect(getByText('Item 1')).toBeDefined()
    expect(getByText('Paragraph 1')).toBeDefined()
    expect(getByText('Paragraph 2')).toBeDefined()
    expect(getByText('Item 2')).toBeDefined()
    // Should have <p> tags for paragraphs
    expect(container.querySelectorAll('p').length).toBe(2)
  })

  it('renders an unterminated list', () => {
    const text = '- Item 1'
    const { getByText } = render(<Markdown text={text} />)
    expect(getByText('Item 1')).toBeDefined()
  })

  it('renders nested unordered list with sub-items', () => {
    const text = `- Parent item
  - Child item
    - Grandchild item`
    const { getByText } = render(<Markdown text={text} />)
    expect(getByText('Parent item')).toBeDefined()
    expect(getByText('Child item')).toBeDefined()
    expect(getByText('Grandchild item')).toBeDefined()
  })

  it('renders nested ordered list', () => {
    const text = `1. First item
   1. Nested item
   2. Another nested item
2. Second item`
    const { getByText } = render(<Markdown text={text} />)
    expect(getByText('First item')).toBeDefined()
    expect(getByText('Nested item')).toBeDefined()
    expect(getByText('Another nested item')).toBeDefined()
    expect(getByText('Second item')).toBeDefined()
  })

  it('handles blank lines in lists', () => {
    const text = '- Item 1\n\n- Item 2\n\n- Item 3'
    const { container, getByText } = render(<Markdown text={text} />)
    expect(getByText('Item 1')).toBeDefined()
    expect(getByText('Item 2')).toBeDefined()
    expect(getByText('Item 3')).toBeDefined()
    expect(container.querySelectorAll('ul').length).toBe(1)
    expect(container.querySelectorAll('li').length).toBe(3)
  })

  it('renders inline code inside a nested list with mixed formatting', () => {
    const text = `- Item with inline code: \`const x = 10;\`
  - Child item with **bold** text and \`inline code\``
    const { getByText, container } = render(<Markdown text={text} />)
    // Check for the plain text parts
    expect(getByText('Item with inline code:')).toBeDefined()
    expect(getByText('const x = 10;')).toBeDefined()
    expect(getByText('bold')).toBeDefined()
    expect(getByText('inline code')).toBeDefined()
    // Verify that inline code elements exist
    const inlineCodes = container.querySelectorAll('code')
    expect(inlineCodes.length).toBe(2)
  })

  it('renders a nested code block within a list item', () => {
    const text = `- List item with code:
  \`\`\`js
  console.log("Nested code")
  \`\`\``
    const { container, getByText } = render(<Markdown text={text} />)
    expect(getByText('List item with code:')).toBeDefined()
    expect(getByText('console.log("Nested code")')).toBeDefined()
    const codeBlock = container.querySelector('pre')
    expect(codeBlock).toBeDefined()
    expect(codeBlock?.textContent).toContain('console.log("Nested code")')
  })

  it('renders a list with unicode dash –', () => {
    const text = '– Item 1\n– Item 2\n– Item 3\n\n'
    const { getByText } = render(<Markdown text={text} />)
    expect(getByText('Item 1')).toBeDefined()
    expect(getByText('Item 2')).toBeDefined()
    expect(getByText('Item 3')).toBeDefined()
  })

  it('renders a list with unicode dot •', () => {
    const text = '• Item 1\n• Item 2\n• Item 3\n\n'
    const { getByText } = render(<Markdown text={text} />)
    expect(getByText('Item 1')).toBeDefined()
    expect(getByText('Item 2')).toBeDefined()
    expect(getByText('Item 3')).toBeDefined()
  })
})

describe('Markdown with nested elements', () => {
  it('renders nested formatting with bold, italic, and inline code', () => {
    const text = 'This is **bold text with *italic and `code` inside* text**.'
    const { container } = render(<Markdown text={text} />)
    // Check for inline code element
    const codeElem = container.querySelector('code')
    expect(codeElem).toBeDefined()
    // Check for italic element that should contain the inline code
    const italicElem = container.querySelector('em')
    expect(italicElem).toBeDefined()
    expect(italicElem?.textContent).toContain('code')
    // The bold text should wrap the entire content
    const boldElem = container.querySelector('strong')
    expect(boldElem).toBeDefined()
    expect(boldElem?.textContent).toContain('bold text with')
  })

  it('renders an image inside a link', () => {
    const text = '[![mit license](https://img.shields.io/badge/License-MIT-orange.svg)](https://opensource.org/licenses/MIT)'
    const { container } = render(<Markdown text={text} />)

    // Check that we have an image
    const img = container.querySelector('img')
    expect(img).toBeDefined()
    expect(img?.getAttribute('alt')).toBe('mit license')
    expect(img?.getAttribute('src')).toBe('https://img.shields.io/badge/License-MIT-orange.svg')

    // Check that the image is inside a link
    const link = container.querySelector('a')
    expect(link).toBeDefined()
    expect(link?.getAttribute('href')).toBe('https://opensource.org/licenses/MIT')
    expect(link?.contains(img)).toBe(true)
  })

  it('handles multiple images inside links in one paragraph', () => {
    const text = 'Check [![license](https://img.shields.io/badge/License-MIT-orange.svg)](https://opensource.org/licenses/MIT) and [![npm](https://img.shields.io/npm/v/package.svg)](https://www.npmjs.com/package)'
    const { container } = render(<Markdown text={text} />)

    const links = container.querySelectorAll('a')
    expect(links.length).toBe(2)

    const images = container.querySelectorAll('img')
    expect(images.length).toBe(2)
    if (!(0 in images && 1 in images)) {
      throw new Error('should not occur')
    }

    // First link contains first image
    expect(links[0]?.getAttribute('href')).toBe('https://opensource.org/licenses/MIT')
    expect(links[0]?.contains(images[0])).toBe(true)
    expect(images[0].getAttribute('alt')).toBe('license')

    // Second link contains second image
    expect(links[1]?.getAttribute('href')).toBe('https://www.npmjs.com/package')
    expect(links[1]?.contains(images[1])).toBe(true)
    expect(images[1].getAttribute('alt')).toBe('npm')
  })

  it('handles images and text inside links', () => {
    const text = '[Click here ![icon](https://example.com/icon.png) for more info](https://example.com)'
    const { container } = render(<Markdown text={text} />)

    const link = container.querySelector('a')
    expect(link).toBeDefined()
    expect(link?.getAttribute('href')).toBe('https://example.com')

    // Check that the link contains both text fragments
    const linkText = link?.textContent ?? ''
    expect(linkText.includes('Click here')).toBe(true)
    expect(linkText.includes('for more info')).toBe(true)

    // Image should be inside the link
    const img = container.querySelector('img')
    expect(img).toBeDefined()
    expect(img?.getAttribute('src')).toBe('https://example.com/icon.png')
    expect(link?.contains(img)).toBe(true)
  })

  it('handles incomplete image syntax without closing bracket', () => {
    const text = '![alt'
    const { container } = render(<Markdown text={text} />)

    expect(container.textContent).toBe('![alt')
    expect(container.querySelector('img')).toBeNull()
  })

  it('handles incomplete image syntax without closing parenthesis', () => {
    const text = '![alt](https://example.com/image.png'
    const { container } = render(<Markdown text={text} />)

    expect(container.textContent).toBe('![alt](https://example.com/image.png')
    expect(container.querySelector('img')).toBeNull()
  })

  it('handles incomplete link syntax without closing bracket', () => {
    const text = '[link'
    const { container } = render(<Markdown text={text} />)

    // The parser treats this as a text token with '['
    expect(container.textContent).toBe('[')
    expect(container.querySelector('a')).toBeNull()
  })

  it('handles unclosed image link', () => {
    const text = '![alt]'
    const { container } = render(<Markdown text={text} />)

    expect(container.textContent).toBe('![alt]')
    expect(container.querySelector('img')).toBeNull()
  })

  it('handles unclosed link', () => {
    const text = '[link]'
    const { container } = render(<Markdown text={text} />)

    expect(container.textContent).toBe('[link]')
    expect(container.querySelector('a')).toBeNull()
  })

  it('renders a list immediately after a paragraph', () => {
    const text = 'List:\n   - First\n   - Second'
    const { getByText } = render(<Markdown text={text} />)
    expect(getByText('First')).toBeDefined()
    expect(getByText('Second')).toBeDefined()
    expect(getByText('List:')).toBeDefined()
    expect(getByText('List:').tagName).toBe('P')
    expect(getByText('First').tagName).toBe('LI')
    expect(getByText('Second').tagName).toBe('LI')
  })
})
