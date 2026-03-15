import { render } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import Json from './Json.js'
import { isPrimitive, shouldObjectCollapse } from './helpers.js'

describe('Json Component', () => {
  it('renders primitive types correctly', () => {
    const { getByText } = render(<Json json="test" />)
    getByText('"test"')
  })

  it('renders bigint correctly', () => {
    const { getByText } = render(<Json json={BigInt(100)} />)
    getByText('100')
  })

  it('renders an array', () => {
    const { getByText } = render(<Json json={['foo', 'bar']} />)
    getByText('"foo"')
    getByText('"bar"')
  })

  it('expands root array by default', () => {
    const { getByRole } = render(<Json json={[1, 2, 3]} />)
    expect(getByRole('treeitem').ariaExpanded).toBe('true')
  })

  it('collapses array with primitives when expandRoot is false', () => {
    const { getByRole } = render(<Json json={[1, 2, 3]} expandRoot={false} />)
    expect(getByRole('treeitem').ariaExpanded).toBe('false')
  })

  it.for([
    ['foo', 'bar'],
    [],
    [1, 2, 3],
    [1, 'foo', null, undefined],
  ])('shows short arrays of primitive items, without trailing comment about length', (array) => {
    const { queryByText } = render(<Json json={array} />)
    expect(queryByText('...')).toBeNull()
    expect(queryByText(/length/)).toBeNull()
  })

  it('hides long arrays with trailing comment about length when collapsed', () => {
    const longArray = Array.from({ length: 101 }, (_, i) => i)
    const { getByText } = render(<Json json={longArray} expandRoot={false} />)
    getByText('...')
    getByText(/length/)
  })

  it('renders an object', () => {
    const { getByText } = render(<Json json={{ key: 'value' }} />)
    getByText('key:')
    getByText('"value"')
  })

  it('renders a Date as its ISO string', () => {
    const { getByText } = render(<Json json={new Date('2025-01-01')} />)
    getByText('"2025-01-01T00:00:00.000Z"')
  })

  it('renders nested objects', () => {
    const { getByText } = render(<Json json={{ obj: { arr: [314, '42'] } }} />)
    getByText('obj:')
    getByText('arr:')
    getByText('314')
    getByText('"42"')
  })

  it.for([
    [1, 'foo', [1, 2, 3]],
    [1, 'foo', { nested: true }],
  ])('expands short arrays with inner arrays or objects', (arr) => {
    const { getAllByRole } = render(<Json json={arr} />)
    const treeItems = getAllByRole('treeitem')
    expect(treeItems.length).toBe(2)
    expect(treeItems[0]?.getAttribute('aria-expanded')).toBe('true') // the root
    expect(treeItems[1]?.getAttribute('aria-expanded')).toBe('false') // the non-primitive value (object/array)
  })

  it.for([
    ['foo', 'bar'],
    [1, 'foo', null],
  ])('expands short arrays with strings', (arr) => {
    const { getByRole } = render(<Json json={arr} />)
    expect(getByRole('treeitem').getAttribute('aria-expanded')).toBe('true')
  })

  it.for([
    { obj: [314, null] },
    { obj: { nested: true } },
  ])('expands short objects with non-primitive values', (obj) => {
    const { getAllByRole } = render(<Json json={obj} />)
    const treeItems = getAllByRole('treeitem')
    expect(treeItems.length).toBe(2)
    expect(treeItems[0]?.getAttribute('aria-expanded')).toBe('true') // the root
    expect(treeItems[1]?.getAttribute('aria-expanded')).toBe('false') // the non-primitive value (object/array)
  })

  it.for([
    { obj: [314, null] },
    { obj: { nested: true } },
  ])('hides the content and append number of entries when objects with non-primitive values are collapsed', async (obj) => {
    const { getAllByRole, getByText } = render(<Json json={obj} />)
    const root = getAllByRole('treeitem')[0]
    if (!root) { /* type assertion, getAllByRole would already have thrown */
      throw new Error('No root element found')
    }
    const user = userEvent.setup()
    await user.click(root)
    expect(root.getAttribute('aria-expanded')).toBe('false')
    getByText('...')
    getByText(/entries/)
  })

  it('expands root object by default', () => {
    const { getByRole } = render(<Json json={{ a: 1, b: 2 }} />)
    expect(getByRole('treeitem').getAttribute('aria-expanded')).toBe('true')
  })

  it('collapses objects with only primitive values when expandRoot is false', () => {
    const { getByRole } = render(<Json json={{ a: 1, b: 2 }} expandRoot={false} />)
    expect(getByRole('treeitem').getAttribute('aria-expanded')).toBe('false')
  })

  it('hides the content and append number of entries when objects has many entries when collapsed', () => {
    const longObject = Object.fromEntries(Array.from({ length: 101 }, (_, i) => [`key${i}`, { nested: true }]))
    const { getByText } = render(<Json json={longObject} expandRoot={false} />)
    getByText('...')
    getByText(/entries/)
  })

  it('paginates large arrays showing only first 100 items', () => {
    const largeArray = Array.from({ length: 150 }, (_, i) => i)
    const { getByText, queryByText } = render(<Json json={largeArray} />)
    getByText('0')
    getByText('99')
    expect(queryByText('100')).toBeNull()
    getByText('Show more...')
  })

  it('shows more array items when clicking Show more...', async () => {
    const largeArray = Array.from({ length: 150 }, (_, i) => i)
    const { getByText, queryByText } = render(<Json json={largeArray} />)
    const user = userEvent.setup()
    await user.click(getByText('Show more...'))
    getByText('100')
    getByText('149')
    expect(queryByText('Show more...')).toBeNull()
  })

  it('paginates large objects showing only first 100 entries', () => {
    const largeObj = Object.fromEntries(Array.from({ length: 150 }, (_, i) => [`key${i}`, i]))
    const { getByText, queryByText } = render(<Json json={largeObj} />)
    getByText('key0:')
    getByText('key99:')
    expect(queryByText('key100:')).toBeNull()
    getByText('Show more...')
  })

  it('shows more object entries when clicking Show more...', async () => {
    const largeObj = Object.fromEntries(Array.from({ length: 150 }, (_, i) => [`key${i}`, i]))
    const { getByText, queryByText } = render(<Json json={largeObj} />)
    const user = userEvent.setup()
    await user.click(getByText('Show more...'))
    getByText('key100:')
    getByText('key149:')
    expect(queryByText('Show more...')).toBeNull()
  })

  it('toggles array collapse state', async () => {
    const longArray = Array.from({ length: 101 }, (_, i) => i)
    const { getByRole, getByText, queryByText } = render(<Json json={longArray} />)
    const treeItem = getByRole('treeitem')
    expect(queryByText('...')).toBeNull() // expanded by default
    const user = userEvent.setup()
    await user.click(treeItem) // collapse
    getByText('...')
    await user.click(treeItem) // expand again
    expect(queryByText('...')).toBeNull()
  })

  it('toggles object collapse state', async () => {
    const longObject = Object.fromEntries(Array.from({ length: 101 }, (_, i) => [`key${i}`, { nested: true }]))
    const { getAllByRole, getByRole, getByText, queryByText } = render(<Json json={longObject} />)
    const treeItem = getAllByRole('treeitem')[0] // expanded by default due to expandRoot
    if (!treeItem) throw new Error('No root element found')
    expect(queryByText('...')).toBeNull()
    const user = userEvent.setup()
    await user.click(treeItem) // collapse
    getByRole('treeitem') // now only one treeitem
    getByText('...')
    await user.click(treeItem) // expand again
    expect(queryByText('...')).toBeNull()
  })

  it('renders Uint8Array as hex dump', () => {
    const bytes = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f])
    const { getByText } = render(<Json json={bytes} />)
    getByText('Uint8Array(5)')
    getByText(/48 65 6c 6c 6f/)
    getByText('Hello')
  })

  it('renders ArrayBuffer as hex dump', () => {
    const { buffer } = new Uint8Array([0xff, 0x00, 0x7e])
    const { getByText } = render(<Json json={buffer} />)
    getByText(/ff 00 7e/)
  })
})

describe('isPrimitive', () => {
  it('returns true only for primitive types (string is an exception)', () => {
    expect(isPrimitive(42)).toBe(true)
    expect(isPrimitive(true)).toBe(true)
    expect(isPrimitive(1n)).toBe(true)
    expect(isPrimitive(null)).toBe(true)
    expect(isPrimitive(undefined)).toBe(true)
    expect(isPrimitive({})).toBe(false)
    expect(isPrimitive([])).toBe(false)
    expect(isPrimitive('test')).toBe(false)
  })
})

describe('shouldObjectCollapse', () => {
  it('returns true for objects with all primitive (but string) values', () => {
    expect(shouldObjectCollapse({ a: 1, b: false })).toBe(true)
  })

  it('returns false for objects with non-primitive (or string) values', () => {
    expect(shouldObjectCollapse({ a: 1, b: {} })).toBe(false)
    expect(shouldObjectCollapse({ a: 1, b: 'test' })).toBe(false)
  })

  it('returns true for large objects', () => {
    const largeObject = Object.fromEntries(Array.from({ length: 101 }, (_, i) => [`key${i}`, i]))
    expect(shouldObjectCollapse(largeObject)).toBe(true)
  })
})
