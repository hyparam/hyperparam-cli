import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ConfigProvider } from '../../hooks/useConfig.js'
import Welcome from './Welcome.js'

describe('Welcome Component', () => {
  it('renders welcome content', () => {
    const onClose = vi.fn()
    const { getByRole, getByText } = render(<Welcome onClose={onClose} />)

    expect(getByText('npx hyperparam')).toBeDefined()
    expect(getByText('Got it')).toBeDefined()
    const button = getByRole('button')
    expect(button).toBeDefined()
    expect(button.textContent).toBe('Got it')
  })

  it('calls onClose when button is clicked', () => {
    const onClose = vi.fn()
    const { getByRole } = render(<Welcome onClose={onClose} />)

    fireEvent.click(getByRole('button'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when clicking outside the popup', () => {
    const onClose = vi.fn()
    const { container } = render(<Welcome onClose={onClose} />)

    // Find the backdrop element
    const backdropElement = container.querySelector('.welcome')
    expect(backdropElement).toBeDefined()

    if (backdropElement) {
      fireEvent.click(backdropElement)
      expect(onClose).toHaveBeenCalledTimes(1)
    }
  })

  it('does not call onClose when clicking inside the popup', () => {
    const onClose = vi.fn()
    const { getByText } = render(<Welcome onClose={onClose} />)

    // Find and click on an element inside the popup content
    const paragraphElement = getByText('Supported file types include Parquet, CSV, JSON, Markdown, and Text.')
    fireEvent.click(paragraphElement)

    expect(onClose).not.toHaveBeenCalled()
  })

  it('calls onClose when pressing Escape key', () => {
    const onClose = vi.fn()
    render(<Welcome onClose={onClose} />)

    // Simulate pressing the Escape key
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose when pressing other keys', () => {
    const onClose = vi.fn()
    render(<Welcome onClose={onClose} />)

    // Simulate pressing a different key
    fireEvent.keyDown(window, { key: 'Enter' })
    expect(onClose).not.toHaveBeenCalled()
  })

  it('renders custom content and button text', () => {
    const onClose = vi.fn()
    const customContent = <p>Custom welcome message</p>
    const customButtonText = 'Custom Got it'
    const { getByText } = render(
      <ConfigProvider value={{ welcome: { content: customContent, buttonText: customButtonText } }}>
        <Welcome onClose={onClose} />
      </ConfigProvider>
    )

    expect(getByText('Custom welcome message')).toBeDefined()
    expect(getByText('Custom Got it')).toBeDefined()
  })
})
