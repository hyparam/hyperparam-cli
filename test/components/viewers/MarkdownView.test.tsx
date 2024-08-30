import { render } from '@testing-library/react'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import MarkdownView from '../../../src/components/viewers/MarkdownView.js'

global.fetch = vi.fn()

describe('MarkdownView Component', () => {
  it('renders markdown correctly', () => {
    const text = '# Markdown\n\nThis is a test of the markdown viewer.'
    vi.mocked(fetch).mockResolvedValueOnce({
      text: () => Promise.resolve(text),
    } as unknown as Response)

    const { findByText } = render(
      <MarkdownView content={'test.md'} setError={console.error} />
    )
    expect(fetch).toHaveBeenCalled()
    expect(findByText('Markdown')).resolves.toBeDefined()
    expect(findByText('This is a test of the markdown viewer.')).resolves.toBeDefined()
  })
})