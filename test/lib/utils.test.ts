import { describe, expect, it } from 'vitest'
import { cn } from '../../src/index.js'

describe('Classname function', () => {
  it('joins class names correctly', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2')
  })

  it('ignores undefined and false values', () => {
    expect(cn('class1', undefined, 'class2', false)).toBe('class1 class2')
  })

  it('returns empty string if no valid class names', () => {
    expect(cn(undefined, false)).toBe('')
  })

  it('handles single class name', () => {
    expect(cn('class1')).toBe('class1')
  })
})
