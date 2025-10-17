
import { render } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ConfigProvider } from '../../hooks/useConfig.js'
import SlidePanel from './SlidePanel.js'

describe('SlidePanel', () => {
  // Minimal localStorage mock
  const localStorageMock = (() => {
    let store: Record<string, string> = {}
    return {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => { store[key] = value },
      clear: () => { store = {} },
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      removeItem: (key: string) => { delete store[key] },
    }
  })()

  beforeEach(() => {
    vi.stubGlobal('localStorage', localStorageMock)
    localStorage.clear()
  })

  it('renders main and panel content', () => {
    const { getByText } = render(
      <SlidePanel
        mainContent={<div data-testid="main-content">Main</div>}
        panelContent={<div data-testid="panel-content">Panel</div>}
        isPanelOpen
      />
    )
    getByText('Main')
    getByText('Panel')
  })

  it('does not render the resizer if panel is closed', () => {
    const { queryByRole } = render(
      <SlidePanel
        mainContent={<div>Main</div>}
        panelContent={<div>Panel</div>}
        isPanelOpen={false}
      />
    )
    expect(queryByRole('separator')).toBeNull()
  })

  it('uses default width of 400 when localStorage is empty', () => {
    const { getByRole } = render(
      <SlidePanel
        mainContent={<div>Main</div>}
        panelContent={<div>Panel</div>}
        isPanelOpen
      />
    )
    // Panel is an <aside> element, and has the implicit role 'complementary'
    const panel = getByRole('complementary')
    expect(panel.textContent).toBe('Panel')
    expect(panel.style.width).toBe('400px')
  })

  it('loads width from localStorage if present', () => {
    localStorage.setItem('panelWidth', '250')
    const { getByRole } = render(
      <SlidePanel
        mainContent={<div>Main</div>}
        panelContent={<div>Panel</div>}
        isPanelOpen
      />
    )
    const panel = getByRole('complementary')
    expect(panel.style.width).toBe('250px')
  })

  it('falls back to default width if localStorage width is invalid', () => {
    localStorage.setItem('panelWidth', 'not-a-number')
    const { getByRole } = render(
      <SlidePanel
        mainContent={<div>Main</div>}
        panelContent={<div>Panel</div>}
        isPanelOpen
      />
    )
    const panel = getByRole('complementary')
    // parseInt of 'not-a-number' yields NaN so default width of 400 is expected
    expect(panel.style.width).toBe('400px')
  })

  it('respects minWidth from config', async () => {
    const { getByRole } = render(
      <ConfigProvider value={{ slidePanel: { minWidth: 300 } }}>
        <SlidePanel
          mainContent={<div>Main</div>}
          panelContent={<div>Panel</div>}
          isPanelOpen
        />
      </ConfigProvider>
    )
    const resizer = getByRole('separator')
    const panel = getByRole('complementary')
    expect(panel.style.width).toBe('400px')

    const user = userEvent.setup()
    await user.pointer([
      // Simulate mousedown on resizer with clientX 800
      { keys: '[MouseLeft>]', target: resizer, coords: { x: 800, y: 0 } },
      // Simulate mousemove on document with clientX such that new width is less than minWidth
      { coords: { x: 950, y: 0 } },
      { keys: '[/MouseLeft]' },
    ])

    // resizingClientX was set to 800 + 400 = 1200 so new width = max(300, 1200 - 950) = 300
    expect(panel.style.width).toBe('300px')
  })

  it('handles dragging to resize', async () => {
    const { getByRole } = render(
      <SlidePanel
        mainContent={<div>Main</div>}
        panelContent={<div>Panel</div>}
        isPanelOpen
      />
    )
    const resizer = getByRole('separator')
    const panel = getByRole('complementary')
    expect(panel.style.width).toBe('400px')

    // Mock panel's offsetWidth to be 400px
    Object.defineProperty(panel, 'offsetWidth', { value: 400, configurable: true })

    const user = userEvent.setup()
    await user.pointer([
      { keys: '[MouseLeft>]', target: resizer, coords: { x: 800, y: 0 } },
      { coords: { x: 750, y: 0 } },
      { keys: '[/MouseLeft]' },
    ])

    // Expected new width = 1200 - 750 = 450
    expect(panel.style.width).toBe('450px')
    expect(localStorage.getItem('panelWidth')).toBe('450')
  })

  it('uses config defaultWidth if valid', () => {
    const { getByRole } = render(
      <ConfigProvider value={{ slidePanel: { defaultWidth: 500 } }}>
        <SlidePanel
          mainContent={<div>Main</div>}
          panelContent={<div>Panel</div>}
          isPanelOpen
        />
      </ConfigProvider>
    )
    const panel = getByRole('complementary')
    expect(panel.style.width).toBe('500px')
  })

  it('ignores negative config.defaultWidth and uses 400 instead', () => {
    const { getByRole } = render(
      <ConfigProvider value={{ slidePanel: { defaultWidth: -10 } }}>
        <SlidePanel
          mainContent={<div>Main</div>}
          panelContent={<div>Panel</div>}
          isPanelOpen
        />
      </ConfigProvider>
    )
    const panel = getByRole('complementary')
    expect(panel.style.width).toBe('400px')
  })
})
