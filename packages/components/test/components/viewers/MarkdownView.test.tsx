import { parseKey } from '@hyparam/utils'
import { render } from '@testing-library/react'
import { strict as assert } from 'assert'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import MarkdownView from '../../../src/components/viewers/MarkdownView.js'

global.fetch = vi.fn()

describe('MarkdownView Component', () => {
  it('renders markdown correctly', async () => {
    const text = '# Markdown\n\nThis is a test of the markdown viewer.'
    vi.mocked(fetch).mockResolvedValueOnce({
      text: () => Promise.resolve(text),
      headers: new Map([['content-length', text.length]]),
    } as unknown as Response)
    const parsedKey = parseKey('test.md', { apiBaseUrl: 'http://localhost:3000' })
    assert(parsedKey.kind === 'file')

    const { findByText } = render(
      <MarkdownView parsedKey={parsedKey} setError={console.error} />,
    )
    expect(fetch).toHaveBeenCalled()
    await expect(findByText('Markdown')).resolves.toBeDefined()
    await expect(findByText('This is a test of the markdown viewer.')).resolves.toBeDefined()
    await expect(findByText('50 b')).resolves.toBeDefined()
  })
})
