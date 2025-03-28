import { render } from '@testing-library/react'
import React from 'react'
import { describe, expect, it } from 'vitest'
import { Layout } from '../../src/index.js'

describe('Layout Component', () => {
  it('renders children', () => {
    const { getByText } = render(<Layout>Test Content</Layout>)
    expect(getByText('Test Content')).toBeDefined()
    expect(document.title).toBe('hyperparam')
  })

  it('renders title', () => {
    render(<Layout title="Test Title">Test Content</Layout>)
    expect(document.title).toBe('Test Title - hyperparam')
  })

  it('displays progress bar', () => {
    const { getByRole } = render(<Layout progress={0.5}>Test Content</Layout>)
    expect(getByRole('progressbar')).toBeDefined()
  })

  it('displays error message', () => {
    const testError = new Error('Test Error')
    const { getByText } = render(<Layout error={testError}>Test Content</Layout>)
    expect(getByText('Error: Test Error')).toBeDefined()
  })
})
