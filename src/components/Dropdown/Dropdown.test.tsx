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
      <Dropdown label='go'><div>Child 1</div><div>Child 2</div></Dropdown>
    )

    const dropdownButton = getByRole('button')
    fireEvent.click(dropdownButton)

    // Check if dropdown content appears
    expect(div?.children[0]?.getAttribute('aria-expanded')).toBe('true')

    // Click again to close
    fireEvent.click(dropdownButton)
    expect(div?.children[0]?.getAttribute('aria-expanded')).toBe('false')
  })

  it('closes dropdown when clicking outside', () => {
    const { container: { children: [ div ] }, getByRole } = render(
      <Dropdown><div>Child 1</div><div>Child 2</div></Dropdown>
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
      <Dropdown><div>Child 1</div><div>Child 2</div></Dropdown>
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
      <Dropdown><div>Child 1</div><div>Child 2</div></Dropdown>
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
})
