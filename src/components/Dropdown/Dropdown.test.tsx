import { act, render } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import Dropdown from './Dropdown'
import styles from './Dropdown.module.css'

describe('Dropdown Component', () => {
  it('renders dropdown with its children', () => {
    const { container: { children: [ div ] }, getByText } = render(
      <Dropdown><div>Child 1</div><div>Child 2</div></Dropdown>
    )
    expect(div?.children[0]?.getAttribute('aria-expanded')).toBe('false')
    getByText('Child 1')
    getByText('Child 2')
    expect(div?.classList).toContain(styles.dropdownLeft)
  })

  it('toggles dropdown content on button click', async () => {
    const { container: { children: [ div ] }, getByRole } = render(
      <Dropdown label='go'>
        <div>Child 1</div>
        <div>Child 2</div>
      </Dropdown>
    )
    const dropdownButton = getByRole('button')

    // open menu with click
    const user = userEvent.setup()
    await user.click(dropdownButton)
    expect(div?.children[0]?.getAttribute('aria-expanded')).toBe('true')

    // click again to close
    await user.click(dropdownButton)
    expect(div?.children[0]?.getAttribute('aria-expanded')).toBe('false')
  })

  it('closes dropdown when clicking outside', async () => {
    const { container: { children: [ div ] }, getByRole } = render(
      <Dropdown>
        <div>Child 1</div>
        <div>Child 2</div>
      </Dropdown>
    )

    const dropdownButton = getByRole('button')
    const user = userEvent.setup()
    await user.click(dropdownButton) // open dropdown
    expect(div?.children[0]?.getAttribute('aria-expanded')).toBe('true')

    // Simulate a click outside
    await user.click(document.body)
    expect(div?.children[0]?.getAttribute('aria-expanded')).toBe('false')
  })

  it('closes dropdown when clicking inside', async () => {
    const { container: { children: [ div ] }, getByRole, getByText } = render(
      <Dropdown>
        <div>Child 1</div>
        <div>Child 2</div>
      </Dropdown>
    )

    const dropdownButton = getByRole('button')
    const user = userEvent.setup()
    await user.click(dropdownButton) // open dropdown
    expect(div?.children[0]?.getAttribute('aria-expanded')).toBe('true')

    const dropdownContent = getByText('Child 1').parentElement
    if (!dropdownContent) throw new Error('Dropdown content not found')
    await user.click(dropdownContent)
    expect(div?.children[0]?.getAttribute('aria-expanded')).toBe('false')
  })

  it('closes dropdown on escape key press', async () => {
    const { container: { children: [ div ] }, getByRole } = render(
      <Dropdown>
        <div>Child 1</div>
        <div>Child 2</div>
      </Dropdown>
    )

    const dropdownButton = getByRole('button')
    const user = userEvent.setup()
    await user.click(dropdownButton) // open dropdown
    expect(div?.children[0]?.getAttribute('aria-expanded')).toBe('true')

    // Press escape key
    await user.keyboard('{Escape}')
    expect(div?.children[0]?.getAttribute('aria-expanded')).toBe('false')
  })

  it('adds dropdownLeft class when align is left', () => {
    const { container: { children: [ div ] } } = render(
      <Dropdown align='left'><div>Child 1</div><div>Child 2</div></Dropdown>
    )
    expect(div?.classList).toContain(styles.dropdownLeft)
  })

  it('cleans up event listeners on unmount', () => {
    const { unmount } = render(<Dropdown><div>Dropdown Content</div></Dropdown>)

    // Mock function to replace the actual document event listener
    const mockRemoveEventListener = vi.spyOn(document, 'removeEventListener')

    // Unmount the component
    unmount()

    // Check if the event listener was removed
    expect(mockRemoveEventListener).toHaveBeenCalledWith('click', expect.any(Function))
    expect(mockRemoveEventListener).toHaveBeenCalledWith('keydown', expect.any(Function))
    expect(mockRemoveEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function))
  })

  // Keyboard navigation tests
  it('opens dropdown and focuses first item on ArrowDown when closed', async () => {
    const { getByRole, getAllByRole } = render(
      <Dropdown label="Menu">
        <button role="menuitem">Item 1</button>
        <button role="menuitem">Item 2</button>
      </Dropdown>
    )
    const menuItems = getAllByRole('menuitem')
    const dropdownButton = getByRole('button')

    // initially closed
    expect(dropdownButton.getAttribute('aria-expanded')).toBe('false')

    // focus the button
    act(() => {
      dropdownButton.focus()
    })
    // down arrow to open menu
    const user = userEvent.setup()
    await user.keyboard('{ArrowDown}')
    expect(dropdownButton.getAttribute('aria-expanded')).toBe('true')

    // first menu item should be focused
    expect(document.activeElement).toBe(menuItems[0])
  })

  it('focuses the next item on ArrowDown and wraps to first item if at the end', async () => {
    const { getByRole, getAllByRole } = render(
      <Dropdown label="Menu">
        <button role="menuitem">Item 1</button>
        <button role="menuitem">Item 2</button>
      </Dropdown>
    )
    const menuItems = getAllByRole('menuitem') as [HTMLElement, HTMLElement]
    const dropdownButton = getByRole('button')

    // open menu, first item has focus
    const user = userEvent.setup()
    await user.click(dropdownButton)
    expect(document.activeElement).toBe(menuItems[0])

    // second item should be focused
    await user.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(menuItems[1])

    // wrap back to first item
    await user.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(menuItems[0])
  })

  it('focuses the previous item on ArrowUp and wraps to the last item if at the top', async () => {
    const { getByRole, getAllByRole } = render(
      <Dropdown label="Menu">
        <button role="menuitem">Item 1</button>
        <button role="menuitem">Item 2</button>
      </Dropdown>
    )
    const menuItems = getAllByRole('menuitem') as [HTMLElement, HTMLElement]
    const dropdownButton = getByRole('button')

    // open menu, first item has focus
    const user = userEvent.setup()
    await user.click(dropdownButton)
    expect(document.activeElement).toBe(menuItems[0])

    // ArrowUp -> should wrap to last item
    await user.keyboard('{ArrowUp}')
    expect(document.activeElement).toBe(menuItems[1])
  })

  it('focuses first item on Home key press', async () => {
    const { getByRole, getAllByRole } = render(
      <Dropdown label="Menu">
        <button role="menuitem">Item 1</button>
        <button role="menuitem">Item 2</button>
        <button role="menuitem">Item 3</button>
      </Dropdown>
    )
    const menuItems = getAllByRole('menuitem') as [HTMLElement, HTMLElement, HTMLElement]
    const dropdownButton = getByRole('button')

    // open menu, first item has focus
    const user = userEvent.setup()
    await user.click(dropdownButton)
    expect(document.activeElement).toBe(menuItems[0])

    // move to the second item
    await user.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(menuItems[1])

    // Home key should focus first item
    await user.keyboard('{Home}')
    expect(document.activeElement).toBe(menuItems[0])
  })

  it('focuses last item on End key press', async () => {
    const { getByRole, getAllByRole } = render(
      <Dropdown label="Menu">
        <button role="menuitem">Item 1</button>
        <button role="menuitem">Item 2</button>
        <button role="menuitem">Item 3</button>
      </Dropdown>
    )
    const menuItems = getAllByRole('menuitem') as [HTMLElement, HTMLElement, HTMLElement]
    const dropdownButton = getByRole('button')

    // open menu, first item has focus
    const user = userEvent.setup()
    await user.click(dropdownButton)
    expect(document.activeElement).toBe(menuItems[0])

    // End key should focus the last item
    await user.keyboard('{End}')
    expect(document.activeElement).toBe(menuItems[2])
  })

  it('closes the menu and puts focus back on the button on Escape', async () => {
    const { getByRole, getAllByRole } = render(
      <Dropdown label="Menu">
        <button role="menuitem">Item 1</button>
        <button role="menuitem">Item 2</button>
      </Dropdown>
    )
    const menuItems = getAllByRole('menuitem') as [HTMLElement]
    const dropdownButton = getByRole('button')

    // open menu, first item has focus
    const user = userEvent.setup()
    await user.click(dropdownButton)
    expect(document.activeElement).toBe(menuItems[0])
    expect(dropdownButton.getAttribute('aria-expanded')).toBe('true')

    // escape closes menu
    await user.keyboard('{Escape}')
    expect(dropdownButton.getAttribute('aria-expanded')).toBe('false')

    // focus returns to the button
    expect(document.activeElement).toBe(dropdownButton)
  })
})
