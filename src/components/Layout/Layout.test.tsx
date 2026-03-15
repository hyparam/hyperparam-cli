import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Layout from './Layout.js'

globalThis.console.error = vi.fn()

describe('Layout Component', () => {
  it('renders children', () => {
    const { getByText } = render(<Layout>Test Content</Layout>)
    getByText('Test Content')
    expect(document.title).toBe('hyperparam')
  })

  it('renders title', () => {
    render(<Layout title="Test Title">Test Content</Layout>)
    expect(document.title).toBe('Test Title - hyperparam')
  })

  it('displays progress bar', () => {
    const { getByRole } = render(<Layout progress={0.5}>Test Content</Layout>)
    getByRole('progressbar')
  })

  it('displays error message', () => {
    const testError = new Error('Test Error')
    const { getByText } = render(<Layout error={testError}>Test Content</Layout>)
    getByText('Error: Test Error')
    expect(console.error).toHaveBeenCalledWith(testError)
  })
})
