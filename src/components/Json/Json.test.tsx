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

  it.for([['foo', 'bar']])('collapses any array', (array) => {
    const { queryByText } = render(<Json json={array} />)
    expect(queryByText('▶')).toBeDefined()
    expect(queryByText('▼')).toBeNull()
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

  it('collapses non-primitive nested objects', () => {
    const { getByText } = render(<Json json={{ obj: { arr: [314, null] } }} />)
    expect(getByText('obj:')).toBeDefined()
    expect(getByText('arr:')).toBeDefined()
    expect(getByText('314')).toBeDefined()
    expect(getByText('...')).toBeDefined()
  })

  it('toggles array collapse state', () => {
    const { getByText, queryByText } = render(<Json json={['foo', null]} />)
    expect(getByText('"foo"')).toBeDefined()
    expect(queryByText('null')).toBeNull()
    fireEvent.click(getByText('▶'))
    expect(getByText('null')).toBeDefined()
    fireEvent.click(getByText('▼'))
    expect(getByText('"foo"')).toBeDefined()
    expect(queryByText('null')).toBeNull()
  })

  it('toggles object collapse state', () => {
    const { getByText, queryByText } = render(<Json json={{ key: 'value' }} />)
    expect(getByText('key:')).toBeDefined()
    expect(getByText('"value"')).toBeDefined()
    fireEvent.click(getByText('▶'))
    expect(queryByText('key: "value"')).toBeNull()
    fireEvent.click(getByText('▼'))
    expect(getByText('key:')).toBeDefined()
    expect(getByText('"value"')).toBeDefined()
  })
})

describe('isPrimitive', () => {
  it('returns true only for primitive types', () => {
    expect(isPrimitive('test')).toBe(true)
    expect(isPrimitive(42)).toBe(true)
    expect(isPrimitive(true)).toBe(true)
    expect(isPrimitive(1n)).toBe(true)
    expect(isPrimitive(null)).toBe(false)
    expect(isPrimitive(undefined)).toBe(false)
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
