import React from 'react'
import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ImageView from '../../../src/components/viewers/ImageView.js'

global.fetch = vi.fn()

describe('ImageView Component', () => {
  it('renders the image correctly', async () => {
    const body = new ArrayBuffer(8)
    vi.mocked(fetch).mockResolvedValueOnce({
      arrayBuffer: () => Promise.resolve(body),
    } as unknown as Response)

    const { findByRole } = render(
      <ImageView content={'test.png'} setError={console.error} />
    )

    // wait for asynchronous image loading
    expect(fetch).toHaveBeenCalled()
    const image = await findByRole('img')
    expect(image).toBeDefined()
    expect(image.getAttribute('src')).not.toBeNull()
    expect(image.getAttribute('alt')).toBe('test.png')
  })

  // TODO: test error handling
})
