import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Dropdown from './Dropdown'
import styles from './Dropdown.module.css'

describe('Dropdown Component', () => {
  it('renders dropdown with its children', () => {
    const { container: { children: [ div ] }, queryByText } = render(
      <Dropdown><div>Child 1</div><div>Child 2</div></Dropdown>
    )
    expect(div?.children[0]?.getAttribute('aria-expanded')).toBe('false')
    expect(queryByText('Child 1')).toBeDefined()
    expect(queryByText('Child 2')).toBeDefined()
    expect(div?.classList).toContain(styles.dropdownLeft)
  })

  it('toggles dropdown content on button click', () => {
    const { container: { children: [ div ] }, getByRole } = render(
      <Dropdown label='go'>
        <div>Child 1</div>
        <div>Child 2</div>
      </Dropdown>
    )
    const dropdownButton = getByRole('button')

    // open menu with click
    fireEvent.click(dropdownButton)
    expect(div?.children[0]?.getAttribute('aria-expanded')).toBe('true')

    // click again to close
    fireEvent.click(dropdownButton)
    expect(div?.children[0]?.getAttribute('aria-expanded')).toBe('false')
  })

  it('closes dropdown when clicking outside', () => {
    const { container: { children: [ div ] }, getByRole } = render(
      <Dropdown>
        <div>Child 1</div>
        <div>Child 2</div>
      </Dropdown>
    )

    const dropdownButton = getByRole('button')
    fireEvent.click(dropdownButton) // open dropdown
    expect(div?.children[0]?.getAttribute('aria-expanded')).toBe('true')

    // Simulate a click outside
    fireEvent.mouseDown(document)
    expect(div?.children[0]?.getAttribute('aria-expanded')).toBe('false')
  })

  it('does not close dropdown when clicking inside', () => {
    const { container: { children: [ div ] }, getByRole, getByText } = render(
      <Dropdown>
        <div>Child 1</div>
        <div>Child 2</div>
      </Dropdown>
    )

    const dropdownButton = getByRole('button')
    fireEvent.click(dropdownButton) // open dropdown
    expect(div?.children[0]?.getAttribute('aria-expanded')).toBe('true')

    const dropdownContent = getByText('Child 1').parentElement
    if (!dropdownContent) throw new Error('Dropdown content not found')
    fireEvent.mouseDown(dropdownContent)
    expect(div?.children[0]?.getAttribute('aria-expanded')).toBe('true')
  })

  it('closes dropdown on escape key press', () => {
    const { container: { children: [ div ] }, getByRole } = render(
      <Dropdown>
        <div>Child 1</div>
        <div>Child 2</div>
      </Dropdown>
    )

    const dropdownButton = getByRole('button')
    fireEvent.click(dropdownButton) // open dropdown
    expect(div?.children[0]?.getAttribute('aria-expanded')).toBe('true')

    // Press escape key
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' })
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
  it('opens dropdown and focuses first item on ArrowDown when closed', () => {
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

    // down arrow to open menu
    fireEvent.keyDown(dropdownButton, { key: 'ArrowDown', code: 'ArrowDown' })
    expect(dropdownButton.getAttribute('aria-expanded')).toBe('true')

    // first menu item should be focused
    expect(document.activeElement).toBe(menuItems[0])
  })

  it('focuses the next item on ArrowDown and wraps to first item if at the end', () => {
    const { getByRole, getAllByRole } = render(
      <Dropdown label="Menu">
        <button role="menuitem">Item 1</button>
        <button role="menuitem">Item 2</button>
      </Dropdown>
    )
    const menuItems = getAllByRole('menuitem') as [HTMLElement, HTMLElement]
    const dropdownButton = getByRole('button')

    // open menu, first item has focus
    fireEvent.click(dropdownButton)
    expect(document.activeElement).toBe(menuItems[0])

    // second item should be focused
    fireEvent.keyDown(menuItems[0], { key: 'ArrowDown', code: 'ArrowDown' })
    expect(document.activeElement).toBe(menuItems[1])

    // wrap back to first item
    fireEvent.keyDown(menuItems[1], { key: 'ArrowDown', code: 'ArrowDown' })
    expect(document.activeElement).toBe(menuItems[0])
  })

  it('focuses the previous item on ArrowUp and wraps to the last item if at the top', () => {
    const { getByRole, getAllByRole } = render(
      <Dropdown label="Menu">
        <button role="menuitem">Item 1</button>
        <button role="menuitem">Item 2</button>
      </Dropdown>
    )
    const menuItems = getAllByRole('menuitem') as [HTMLElement, HTMLElement]
    const dropdownButton = getByRole('button')

    // open menu, first item has focus
    fireEvent.click(dropdownButton)
    expect(document.activeElement).toBe(menuItems[0])

    // ArrowUp -> should wrap to last item
    fireEvent.keyDown(menuItems[0], { key: 'ArrowUp', code: 'ArrowUp' })
    expect(document.activeElement).toBe(menuItems[1])
  })

  it('focuses first item on Home key press', () => {
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
    fireEvent.click(dropdownButton)
    expect(document.activeElement).toBe(menuItems[0])

    // move to the second item
    fireEvent.keyDown(menuItems[0], { key: 'ArrowDown', code: 'ArrowDown' })
    expect(document.activeElement).toBe(menuItems[1])

    // Home key should focus first item
    fireEvent.keyDown(menuItems[1], { key: 'Home', code: 'Home' })
    expect(document.activeElement).toBe(menuItems[0])
  })

  it('focuses last item on End key press', () => {
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
    fireEvent.click(dropdownButton)
    expect(document.activeElement).toBe(menuItems[0])

    // End key should focus the last item
    fireEvent.keyDown(menuItems[0], { key: 'End', code: 'End' })
    expect(document.activeElement).toBe(menuItems[2])
  })

  it('closes the menu and puts focus back on the button on Escape', () => {
    const { getByRole, getAllByRole } = render(
      <Dropdown label="Menu">
        <button role="menuitem">Item 1</button>
        <button role="menuitem">Item 2</button>
      </Dropdown>
    )
    const menuItems = getAllByRole('menuitem') as [HTMLElement]
    const dropdownButton = getByRole('button')

    // open menu, first item has focus
    fireEvent.click(dropdownButton)
    expect(document.activeElement).toBe(menuItems[0])
    expect(dropdownButton.getAttribute('aria-expanded')).toBe('true')

    // escape closes menu
    fireEvent.keyDown(menuItems[0], { key: 'Escape', code: 'Escape' })
    expect(dropdownButton.getAttribute('aria-expanded')).toBe('false')

    // focus returns to the button
    expect(document.activeElement).toBe(dropdownButton)
  })
})
