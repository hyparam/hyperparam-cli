import { render, waitFor } from '@testing-library/react'
import { arrayDataFrame } from 'hightable'
import { describe, expect, it, vi } from 'vitest'
import CellPanel from './CellPanel'

const sampleData = [
  { text: 'Hello World', num: 42, obj: { foo: 'bar' } },
  { text: 'Second row', num: 100, obj: { baz: 'qux' } },
]

describe('CellPanel', () => {
  it('renders text content after loading', async () => {
    const df = arrayDataFrame(sampleData)
    const { getByText } = render(
      <CellPanel
        df={df}
        row={0}
        col={0}
        setProgress={vi.fn()}
        setError={vi.fn()}
        onClose={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(getByText('Hello World')).toBeDefined()
    })
  })

  it('renders json lens for object values', async () => {
    const df = arrayDataFrame(sampleData)
    const { getByText } = render(
      <CellPanel
        df={df}
        row={0}
        col={2}
        setProgress={vi.fn()}
        setError={vi.fn()}
        onClose={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(getByText(/foo/)).toBeDefined()
      expect(getByText(/bar/)).toBeDefined()
    })
  })

  it('calls setError when column index is out of bounds', async () => {
    const df = arrayDataFrame(sampleData)
    const setError = vi.fn()
    render(
      <CellPanel
        df={df}
        row={0}
        col={999}
        setProgress={vi.fn()}
        setError={setError}
        onClose={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(setError).toHaveBeenCalled()
    })
  })

  it('renders Error objects with name and message', async () => {
    const errorValue = new Error('Something went wrong')
    const df = arrayDataFrame([{ error: errorValue }])
    const { getByText } = render(
      <CellPanel
        df={df}
        row={0}
        col={0}
        setProgress={vi.fn()}
        setError={vi.fn()}
        onClose={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(getByText(/Error: Something went wrong/)).toBeDefined()
    })
  })

  it('calls onClose when close button is clicked', () => {
    const df = arrayDataFrame(sampleData)
    const onClose = vi.fn()
    const { container } = render(
      <CellPanel
        df={df}
        row={0}
        col={0}
        setProgress={vi.fn()}
        setError={vi.fn()}
        onClose={onClose}
      />
    )

    const closeButton = container.querySelector('button')
    closeButton?.click()

    expect(onClose).toHaveBeenCalled()
  })

  it('loads data for the correct row', async () => {
    const df = arrayDataFrame(sampleData)
    const { getByText } = render(
      <CellPanel
        df={df}
        row={1}
        col={0}
        setProgress={vi.fn()}
        setError={vi.fn()}
        onClose={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(getByText('Second row')).toBeDefined()
    })
  })

  it('renders Date objects as text not json', async () => {
    const date = new Date('2024-01-15T10:30:00Z')
    const df = arrayDataFrame([{ date }])
    const { container } = render(
      <CellPanel
        df={df}
        row={0}
        col={0}
        setProgress={vi.fn()}
        setError={vi.fn()}
        onClose={vi.fn()}
      />
    )

    await waitFor(() => {
      const code = container.querySelector('code')
      expect(code?.textContent).toContain('2024')
    })
  })

  it('shows lens dropdown for object values', async () => {
    const df = arrayDataFrame(sampleData)
    const { getAllByText, container } = render(
      <CellPanel
        df={df}
        row={0}
        col={2}
        setProgress={vi.fn()}
        setError={vi.fn()}
        onClose={vi.fn()}
      />
    )

    await waitFor(() => {
      // Dropdown button shows the current lens
      const dropdownButton = container.querySelector('[aria-haspopup="menu"]')
      expect(dropdownButton).toBeDefined()
      expect(dropdownButton?.textContent).toBe('json')
      // Menu has both lens options
      const menu = container.querySelector('[role="menu"]')
      expect(menu?.children.length).toBe(2)
      expect(getAllByText('text').length).toBe(1)
    })
  })

  it('does not show lens dropdown for plain text', async () => {
    const df = arrayDataFrame(sampleData)
    const { queryByText } = render(
      <CellPanel
        df={df}
        row={0}
        col={0}
        setProgress={vi.fn()}
        setError={vi.fn()}
        onClose={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(queryByText('Hello World')).toBeDefined()
    })
    // No json option should be present
    expect(queryByText('json')).toBeNull()
  })

  it('parses JSON strings and shows lens dropdown', async () => {
    const df = arrayDataFrame([{ data: '{"key": "value"}' }])
    const { container, getByText } = render(
      <CellPanel
        df={df}
        row={0}
        col={0}
        setProgress={vi.fn()}
        setError={vi.fn()}
        onClose={vi.fn()}
      />
    )

    await waitFor(() => {
      // Should parse the JSON string and default to json lens
      const dropdownButton = container.querySelector('[aria-haspopup="menu"]')
      expect(dropdownButton?.textContent).toBe('json')
      expect(getByText(/key/)).toBeDefined()
      expect(getByText(/value/)).toBeDefined()
    })
  })
})
