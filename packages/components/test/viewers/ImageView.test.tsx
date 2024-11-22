import { parseKey } from '@hyparam/utils'
import { render } from '@testing-library/react'
import { strict as assert } from 'assert'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import ImageView from '../../src/viewers/ImageView.js'

global.fetch = vi.fn()

describe('ImageView Component', () => {
  it('renders the image correctly', async () => {
    const body = new ArrayBuffer(8)
    vi.mocked(fetch).mockResolvedValueOnce({
      arrayBuffer: () => Promise.resolve(body),
      headers: new Map([['content-length', body.byteLength]]),
    } as unknown as Response)
    const parsedKey = parseKey('test.png', { apiBaseUrl: 'http://localhost:3000' })
    assert(parsedKey.kind === 'file')

    const { findByRole, findByText } = render(
      <ImageView parsedKey={parsedKey} setError={console.error} />,
    )

    // wait for asynchronous image loading
    expect(fetch).toHaveBeenCalled()
    const image = await findByRole('img')
    expect(image).toBeDefined()
    expect(image.getAttribute('src')).not.toBeNull()
    expect(image.getAttribute('alt')).toBe('test.png')
    await expect(findByText('8 b')).resolves.toBeDefined()
  })

  // TODO: test error handling
})
