import { render } from '@testing-library/react'
import { strict as assert } from 'assert'
import { describe, expect, it, vi } from 'vitest'
import { getHyperparamSource } from '../../lib/sources/index.js'
import MarkdownView from './MarkdownView.js'

globalThis.fetch = vi.fn()

describe('MarkdownView Component', () => {
  it('renders markdown correctly', async () => {
    const text = '# Markdown\n\nThis is a test of the markdown viewer.'
    vi.mocked(fetch).mockResolvedValueOnce({
      text: () => Promise.resolve(text),
      headers: new Map([['content-length', text.length]]),
    } as unknown as Response)

    const source = getHyperparamSource('test.md', { endpoint: 'http://localhost:3000' })
    assert(source?.kind === 'file')

    const { findByText } = render(
      <MarkdownView source={source} setError={console.error} />
    )

    expect(fetch).toHaveBeenCalled()
    await expect(findByText('Markdown')).resolves.toBeDefined()
    await expect(findByText('This is a test of the markdown viewer.')).resolves.toBeDefined()
    await expect(findByText('50 b')).resolves.toBeDefined()
  })
})
