import { render } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ConfigProvider } from '../../hooks/useConfig.js'
import Welcome from './Welcome.js'

const onClose = vi.fn()

describe('Welcome Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders welcome content', () => {
    const { getByRole, getByText } = render(<Welcome onClose={onClose} />)

    getByText('npx hyperparam')
    getByText('Got it')
    const button = getByRole('button')
    expect(button.textContent).toBe('Got it')
  })

  it('calls onClose when button is clicked', async () => {
    const { getByRole } = render(<Welcome onClose={onClose} />)

    await userEvent.setup().click(getByRole('button'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when clicking outside the popup', async () => {
    const { getByRole } = render(<Welcome onClose={onClose} />)

    // Find the backdrop element
    const backdropElement = getByRole('dialog')

    await userEvent.setup().click(backdropElement)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose when clicking inside the popup', async () => {
    const { getByText } = render(<Welcome onClose={onClose} />)

    // Find and click on an element inside the popup content
    const paragraphElement = getByText('Supported file types include Parquet, CSV, JSON, Markdown, and Text.')
    await userEvent.setup().click(paragraphElement)

    expect(onClose).not.toHaveBeenCalled()
  })

  it('calls onClose when pressing Escape key', async () => {
    render(<Welcome onClose={onClose} />)

    // Simulate pressing the Escape key
    await userEvent.setup().keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose when pressing other keys', async () => {
    render(<Welcome onClose={onClose} />)

    // Simulate pressing a different key
    await userEvent.setup().keyboard('{Enter}')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('renders custom content and button text', () => {
    const customContent = <p>Custom welcome message</p>
    const customButtonText = 'Custom Got it'
    const { getByText } = render(
      <ConfigProvider value={{ welcome: { content: customContent, buttonText: customButtonText } }}>
        <Welcome onClose={onClose} />
      </ConfigProvider>
    )

    getByText('Custom welcome message')
    getByText('Custom Got it')
  })
})
