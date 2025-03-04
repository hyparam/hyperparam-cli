import { render } from '@testing-library/react'
import React from 'react'
import { describe, expect, it } from 'vitest'
import { Markdown } from '../../src/index.js'

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

  it('renders an list with bold', () => {
    const text = '- **Item 1**\n- Item 2\n- Item 3\n\n'
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

describe('Markdown with nested elements', () => {
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

    // First link contains first image
    expect(links[0].getAttribute('href')).toBe('https://opensource.org/licenses/MIT')
    expect(links[0].contains(images[0])).toBe(true)
    expect(images[0].getAttribute('alt')).toBe('license')

    // Second link contains second image
    expect(links[1].getAttribute('href')).toBe('https://www.npmjs.com/package')
    expect(links[1].contains(images[1])).toBe(true)
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
})
