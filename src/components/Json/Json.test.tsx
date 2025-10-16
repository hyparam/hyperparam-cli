import { fireEvent, render } from '@testing-library/react'
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

  it.for([
    ['foo', 'bar'],
    [],
    [1, 2, 3],
    [1, 'foo', null],
    Array.from({ length: 101 }, (_, i) => i),
  ])('collapses any array', (array) => {
    const { queryByText } = render(<Json json={array} />)
    expect(queryByText('▶')).toBeTruthy()
    expect(queryByText('▼')).toBeNull()
  })

  it.for([
    ['foo', 'bar'],
    [],
    [1, 2, 3],
    [1, 'foo', null, undefined],
  ])('shows short arrays of primitive items, without trailing comment about length', (array) => {
    const { queryByText } = render(<Json json={array} />)
    expect(queryByText('...')).toBeNull()
    expect(queryByText('length')).toBeNull()
  })

  it.for([
    // [1, 'foo', [1, 2, 3]], // TODO(SL): this one does not collapses, what to do? The text is wrong
    Array.from({ length: 101 }, (_, i) => i),
  ])('hides long arrays, and non-primitive items, with trailing comment about length', (array) => {
    const { getByText } = render(<Json json={array} />)
    getByText('...')
    getByText(/length/)
  })

  it('renders an object', () => {
    const { getByText } = render(<Json json={{ key: 'value' }} />)
    getByText('key:')
    getByText('"value"')
  })

  it('renders nested objects', () => {
    const { getByText } = render(<Json json={{ obj: { arr: [314, '42'] } }} />)
    getByText('obj:')
    getByText('arr:')
    getByText('314')
    getByText('"42"')
  })

  it.for([
    { obj: [314, null] },
    { obj: { nested: true } },
  ])('expands short objects with non-primitive values', (obj) => {
    const { getByText } = render(<Json json={obj} />)
    getByText('▼')
  })

  it.for([
    { obj: [314, null] },
    { obj: { nested: true } },
  ])('hides the content and append number of entries when objects with non-primitive values are collapsed', (obj) => {
    const { getByText } = render(<Json json={obj} />)
    fireEvent.click(getByText('▼'))
    getByText('...')
    getByText(/entries/)
  })

  it.for([
    {},
    { a: 1, b: 2 },
    { a: 1, b: true, c: null, d: undefined },
    Object.fromEntries(Array.from({ length: 101 }, (_, i) => [`key${i}`, { nested: true }])),
  ])('collapses long objects, or objects with only primitive values (included empty object)', (obj) => {
    const { queryByText } = render(<Json json={obj} />)
    expect(queryByText('▶')).toBeTruthy()
    expect(queryByText('▼')).toBeNull()
  })

  it.for([
    Object.fromEntries(Array.from({ length: 101 }, (_, i) => [`key${i}`, { nested: true }])),
  ])('hides the content and append number of entries when objects has many entries', (obj) => {
    const { getByText } = render(<Json json={obj} />)
    getByText('...')
    getByText(/entries/)
  })

  it('toggles array collapse state', () => {
    const longArray = Array.from({ length: 101 }, (_, i) => i)
    const { getByText, queryByText } = render(<Json json={longArray} />)
    getByText('...')
    fireEvent.click(getByText('▶'))
    expect(queryByText('...')).toBeNull()
    fireEvent.click(getByText('▼'))
    getByText('...')
  })

  it('toggles object collapse state', () => {
    const longObject = Object.fromEntries(Array.from({ length: 101 }, (_, i) => [`key${i}`, { nested: true }]))
    const { getByText, queryByText } = render(<Json json={longObject} />)
    getByText('...')
    fireEvent.click(getByText('▶'))
    expect(queryByText('...')).toBeNull()
    fireEvent.click(getByText('▼'))
    getByText('...')
  })
})

describe('isPrimitive', () => {
  it('returns true only for primitive types', () => {
    expect(isPrimitive('test')).toBe(true)
    expect(isPrimitive(42)).toBe(true)
    expect(isPrimitive(true)).toBe(true)
    expect(isPrimitive(1n)).toBe(true)
    expect(isPrimitive(null)).toBe(true)
    expect(isPrimitive(undefined)).toBe(true)
    expect(isPrimitive({})).toBe(false)
    expect(isPrimitive([])).toBe(false)
  })
})

describe('shouldObjectCollapse', () => {
  it('returns true for objects with all primitive values', () => {
    expect(shouldObjectCollapse({ a: 1, b: 'test' })).toBe(true)
  })

  it('returns false for objects with non-primitive values', () => {
    expect(shouldObjectCollapse({ a: 1, b: {} })).toBe(false)
  })

  it('returns true for large objects', () => {
    const largeObject = Object.fromEntries(Array.from({ length: 101 }, (_, i) => [`key${i}`, i]))
    expect(shouldObjectCollapse(largeObject)).toBe(true)
  })
})
