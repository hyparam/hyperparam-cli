import { describe, expect, it, test } from 'vitest'
import { replaceSearchParams } from '../../src/lib/routes.js'

describe('replaceSearchParams', () => {
  test.for([
    undefined,
    {},
  ])('removes the search params by default', (params?: Record<string, string>) => {
    expect(replaceSearchParams(params)).toBe(location.origin + location.pathname)
  })

  it('sets the search params', () => {
    expect(replaceSearchParams({ a: 'a', b: 'b' })).toBe(location.origin + location.pathname + '?a=a&b=b')
  })
})
