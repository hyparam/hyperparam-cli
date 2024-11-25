import { parseKey } from '@hyparam/utils'
import { render } from '@testing-library/react'
import { strict as assert } from 'assert'
import React, { act } from 'react'
import { describe, expect, it, vi } from 'vitest'
import File from '../../src/components/File.js'

// Mock fetch
global.fetch = vi.fn(() => Promise.resolve({ text: vi.fn() } as unknown as Response))

describe('File Component', () => {
  it('renders a local file path', async () => {
    const parsedKey = parseKey('folder/subfolder/test.txt', { apiBaseUrl: 'http://localhost:3000' })
    assert(parsedKey.kind === 'file')

    const { getByText } = await act(() => render(
      <File parsedKey={parsedKey} />,
    ))

    expect(getByText('/')).toBeDefined()
    expect(getByText('folder/')).toBeDefined()
    expect(getByText('subfolder/')).toBeDefined()
    expect(getByText('test.txt')).toBeDefined()
  })

  it('renders a URL', async () => {
    const url = 'https://example.com/test.txt'
    const parsedKey = parseKey(url)
    assert(parsedKey.kind === 'url')

    const { getByText } = await act(() => render(<File parsedKey={parsedKey} />))

    expect(getByText(url)).toBeDefined()
  })

  it('renders correct breadcrumbs for nested folders', async () => {
    const parsedKey = parseKey('folder1/folder2/folder3/test.txt', { apiBaseUrl: 'http://localhost:3000' })
    assert(parsedKey.kind === 'file')
    const { getAllByRole } = await act(() => render(
      <File parsedKey={parsedKey} />,
    ))

    const links = getAllByRole('link')
    expect(links[0].getAttribute('href')).toBe('/')
    expect(links[1].getAttribute('href')).toBe('/files')
    expect(links[2].getAttribute('href')).toBe('/files?key=folder1/')
    expect(links[3].getAttribute('href')).toBe('/files?key=folder1/folder2/')
    expect(links[4].getAttribute('href')).toBe('/files?key=folder1/folder2/folder3/')
    expect(links[5].getAttribute('href')).toBe('/files?key=folder1/folder2/folder3/test.txt')
  })
})
