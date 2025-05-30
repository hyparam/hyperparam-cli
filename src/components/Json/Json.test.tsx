import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Json from './Json.js'
import { isPrimitive, shouldObjectCollapse } from './helpers.js'

describe('Json Component', () => {
  it('renders primitive types correctly', () => {
    const { getByText } = render(<Json json="test" />)
    expect(getByText('"test"')).toBeDefined()
  })

  it('renders bigint correctly', () => {
    const { getByText } = render(<Json json={BigInt(100)} />)
    expect(getByText('100')).toBeDefined()
  })

  it('renders an array', () => {
    const { getByText } = render(<Json json={['foo', 'bar']} />)
    expect(getByText('"foo"')).toBeDefined()
    expect(getByText('"bar"')).toBeDefined()
  })

  it.for([
    ['foo', 'bar'],
    [],
    [1, 2, 3],
    [1, 'foo', null],
    Array.from({ length: 101 }, (_, i) => i),
  ])('collapses any array', (array) => {
    const { queryByText } = render(<Json json={array} />)
    expect(queryByText('▶')).toBeDefined()
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
    [1, 'foo', [1, 2, 3]],
    Array.from({ length: 101 }, (_, i) => i),
  ])('hides long arrays, and non-primitive items, with trailing comment about length', (array) => {
    const { queryByText } = render(<Json json={array} />)
    expect(queryByText('...')).toBeDefined()
    expect(queryByText('length')).toBeDefined()
  })

  it('renders an object', () => {
    const { getByText } = render(<Json json={{ key: 'value' }} />)
    expect(getByText('key:')).toBeDefined()
    expect(getByText('"value"')).toBeDefined()
  })

  it('renders nested objects', () => {
    const { getByText } = render(<Json json={{ obj: { arr: [314, '42'] } }} />)
    expect(getByText('obj:')).toBeDefined()
    expect(getByText('arr:')).toBeDefined()
    expect(getByText('314')).toBeDefined()
    expect(getByText('"42"')).toBeDefined()
  })

  it.for([
    { obj: [314, null] },
    { obj: { nested: true } },
  ])('expands short objects with non-primitive values', (obj) => {
    const { queryByText } = render(<Json json={obj} />)
    expect(queryByText('▼')).toBeDefined()
  })

  it.for([
    { obj: [314, null] },
    { obj: { nested: true } },
  ])('hides the content and append number of entries when objects with non-primitive values are collapsed', (obj) => {
    const { getByText, queryByText } = render(<Json json={obj} />)
    fireEvent.click(getByText('▼'))
    expect(queryByText('...')).toBeDefined()
    expect(queryByText('entries')).toBeDefined()
  })

  it.for([
    {},
    { a: 1, b: 2 },
    { a: 1, b: true, c: null, d: undefined },
    Object.fromEntries(Array.from({ length: 101 }, (_, i) => [`key${i}`, { nested: true }])),
  ])('collapses long objects, or objects with only primitive values (included empty object)', (obj) => {
    const { queryByText } = render(<Json json={obj} />)
    expect(queryByText('▶')).toBeDefined()
    expect(queryByText('▼')).toBeNull()
  })

  it.for([
    Object.fromEntries(Array.from({ length: 101 }, (_, i) => [`key${i}`, { nested: true }])),
  ])('hides the content and append number of entries when objects has many entries', (obj) => {
    const { queryByText } = render(<Json json={obj} />)
    expect(queryByText('...')).toBeDefined()
    expect(queryByText('entries')).toBeDefined()
  })

  it('toggles array collapse state', () => {
    const longArray = Array.from({ length: 101 }, (_, i) => i)
    const { getByText, queryByText } = render(<Json json={longArray} />)
    expect(getByText('...')).toBeDefined()
    fireEvent.click(getByText('▶'))
    expect(queryByText('...')).toBeNull()
    fireEvent.click(getByText('▼'))
    expect(getByText('...')).toBeDefined()
  })

  it('toggles object collapse state', () => {
    const longObject = Object.fromEntries(Array.from({ length: 101 }, (_, i) => [`key${i}`, { nested: true }]))
    const { getByText, queryByText } = render(<Json json={longObject} />)
    expect(getByText('...')).toBeDefined()
    fireEvent.click(getByText('▶'))
    expect(queryByText('...')).toBeNull()
    fireEvent.click(getByText('▼'))
    expect(getByText('...')).toBeDefined()
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
