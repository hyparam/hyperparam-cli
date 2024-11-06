import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Layout, { Spinner } from '../../src/components/Layout.js'
import { cn } from '../../src/lib/utils.js'

vi.mock('next-auth/react', () => ({ signOut: vi.fn(), useSession: vi.fn() }))
vi.mock('next/link', () => ({ default: vi.fn() }))

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

describe('Classname function', () => {
  it('joins class names correctly', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2')
  })

  it('ignores undefined and false values', () => {
    expect(cn('class1', undefined, 'class2', false)).toBe('class1 class2')
  })

  it('returns empty string if no valid class names', () => {
    expect(cn(undefined, false)).toBe('')
  })

  it('handles single class name', () => {
    expect(cn('class1')).toBe('class1')
  })
})

describe('Spinner Component', () => {
  it('renders with base and additional class names', () => {
    const { container } = render(<Spinner className="extra" />)
    expect(container.firstElementChild?.classList).toContain('spinner')
    expect(container.firstElementChild?.classList).toContain('extra')
  })
})
