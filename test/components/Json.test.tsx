import { fireEvent, render } from '@testing-library/react'
import React from 'react'
import { describe, expect, it } from 'vitest'
import Json from '../../src/components/Json/Json.js'

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

  it('renders an object', () => {
    const { getByText } = render(<Json json={{ key: 'value' }} />)
    expect(getByText('key:')).toBeDefined()
    expect(getByText('"value"')).toBeDefined()
  })

  it('renders nested objects', () => {
    const { getByText } = render(<Json json={{ obj: { arr: [314, null] } }} />)
    expect(getByText('obj:')).toBeDefined()
    expect(getByText('arr:')).toBeDefined()
    expect(getByText('314')).toBeDefined()
    expect(getByText('null')).toBeDefined()
  })

  it('toggles array collapse state', () => {
    const { getByText, queryByText } = render(<Json json={['foo', 'bar']} />)
    expect(getByText('"foo"')).toBeDefined()
    expect(getByText('"bar"')).toBeDefined()
    fireEvent.click(getByText('▼'))
    expect(queryByText('0: 1')).toBeNull()
    fireEvent.click(getByText('[...]'))
    expect(getByText('"foo"')).toBeDefined()
    expect(getByText('"bar"')).toBeDefined()
  })

  it('toggles object collapse state', () => {
    const { getByText, queryByText } = render(<Json json={{ key: 'value' }} />)
    expect(getByText('key:')).toBeDefined()
    expect(getByText('"value"')).toBeDefined()
    fireEvent.click(getByText('▼'))
    expect(queryByText('key: "value"')).toBeNull()
    fireEvent.click(getByText('{...}'))
    expect(getByText('key:')).toBeDefined()
    expect(getByText('"value"')).toBeDefined()
  })
})
