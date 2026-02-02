import { describe, expect, it, vi } from 'vitest'
import { parseCsv } from '../../src/index.js'

describe('parseCsv', () => {
  it('parses simple CSV', () => {
    const csv = 'Name,Age,Occupation\nAlice,30,Engineer\nBob,25,Designer'
    const expected = [
      ['Name', 'Age', 'Occupation'],
      ['Alice', '30', 'Engineer'],
      ['Bob', '25', 'Designer'],
    ]
    expect(parseCsv(csv)).toEqual(expected)
  })

  it('ignores empty last line', () => {
    const csv = 'Name,Age,Occupation\nAlice,30,Engineer\n'
    const expected = [
      ['Name', 'Age', 'Occupation'],
      ['Alice', '30', 'Engineer'],
    ]
    expect(parseCsv(csv)).toEqual(expected)
  })

  it('handles quoted fields', () => {
    const csv = 'Name,Age,Occupation\n"Alice, PhD",30,Engineer\nBob,25,"Designer, Senior"'
    const expected = [
      ['Name', 'Age', 'Occupation'],
      ['Alice, PhD', '30', 'Engineer'],
      ['Bob', '25', 'Designer, Senior'],
    ]
    expect(parseCsv(csv)).toEqual(expected)
  })

  it('handles escaped quotes', () => {
    const csv = 'Name,Quote\nAlice,"She said, ""Hello world"""\nBob,"This is ""an example"" of quotes"'
    const expected = [
      ['Name', 'Quote'],
      ['Alice', 'She said, "Hello world"'],
      ['Bob', 'This is "an example" of quotes'],
    ]
    expect(parseCsv(csv)).toEqual(expected)
  })

  it('handles newlines within quoted fields', () => {
    const csv = 'Name,Address\nAlice,"123 Main St.\nAnytown, USA"'
    const expected = [
      ['Name', 'Address'],
      ['Alice', '123 Main St.\nAnytown, USA'],
    ]
    expect(parseCsv(csv)).toEqual(expected)
  })

  it('handles unterminated quotes', () => {
    const csv = 'Name,Quote\nAlice,"This is an unterminated quote\n'
    const expected = [
      ['Name', 'Quote'],
      ['Alice', 'This is an unterminated quote\n'],
    ]
    vi.spyOn(console, 'error')
    expect(parseCsv(csv)).toEqual(expected)
    expect(console.error).toHaveBeenCalledWith('csv unterminated quote')
  })
})
