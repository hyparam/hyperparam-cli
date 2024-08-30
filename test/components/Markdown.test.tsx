import React from 'react'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Markdown from '../../src/components/Markdown.js'

describe('Markdown', () => {
  it('renders plain text as a paragraph', () => {
    const text = 'Hello, world!'
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

  it('renders multiple links in one line', () => {
    const text = 'Check out [Hyp](https://hyperparam.app) on [GitHub](https://github.com/hyparam).'
    const { getAllByRole, getByText } = render(<Markdown text={text} />)
    expect(getByText('Hyp')).toBeDefined()
    expect(getByText('GitHub')).toBeDefined()
    const links = getAllByRole('link')
    expect(links[0].getAttribute('href')).toBe('https://hyperparam.app')
    expect(links[1].getAttribute('href')).toBe('https://github.com/hyparam')
  })

  it('renders a list', () => {
    const text = '- Item 1\n- Item 2\n- Item 3\n\n'
    const { getByText } = render(<Markdown text={text} />)
    expect(getByText('Item 1')).toBeDefined()
    expect(getByText('Item 2')).toBeDefined()
    expect(getByText('Item 3')).toBeDefined()
  })

  it('render an unterminated list', () => {
    const text = '- Item 1'
    const { getByText } = render(<Markdown text={text} />)
    expect(getByText('Item 1')).toBeDefined()
  })

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
})
