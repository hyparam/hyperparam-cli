import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ConfigProvider } from '../../hooks/useConfig.js'
import Spinner from './Spinner.js'

describe('Spinner Component', () => {
  it('renders with base and additional class names', () => {
    const { container } = render(
      <ConfigProvider value={{ customClass: { spinner: 'extra' } }}>
        <Spinner/>
      </ConfigProvider>
    )
    const classNames = [...container.firstElementChild?.classList.values() ?? []]
    // Vite generates class names for CSS modules that look like _spinner_c053a8
    expect(classNames.some(className => className.startsWith('_spinner_'))).toBe(true)
    expect(classNames).toContain('extra')
  })
  it('is accessible as a role=status element', () => {
    const { container } = render( <Spinner/> )
    expect(container.firstElementChild?.getAttribute('role')).toBe('status')
    expect(container.firstElementChild?.getAttribute('aria-live')).toBe('polite')
  })
  it('contains an accessible text for screen readers', () => {
    const { getByText } = render( <Spinner/> )
    getByText('Loading...')
  })
  it('let pass a custom accessible text for screen readers', () => {
    const text = 'Fetching data'
    const { getByText } = render( <Spinner text={text}/> )
    getByText(text)
  })
})
