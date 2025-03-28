import { render } from '@testing-library/react'
import React from 'react'
import { describe, expect, it } from 'vitest'
import { Spinner } from '../../src/index.js'

describe('Spinner Component', () => {
  it('renders with base and additional class names', () => {
    const { container } = render(<Spinner className="extra" />)
    expect(container.firstElementChild?.classList).toContain('spinner')
    expect(container.firstElementChild?.classList).toContain('extra')
  })
})
