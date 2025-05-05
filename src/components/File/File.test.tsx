import { render } from '@testing-library/react'
import { strict as assert } from 'assert'
import { act } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Config, ConfigProvider } from '../../hooks/useConfig.js'
import { getHttpSource, getHyperparamSource } from '../../lib/sources/index.js'
import File from './File.js'

const endpoint = 'http://localhost:3000'

const config: Config = {
  routes: {
    getSourceRouteUrl: ({ sourceId }) => `/files?key=${sourceId}`,
    getCellRouteUrl: ({ sourceId, col, row }) => `/files?key=${sourceId}&col=${col}&row=${row}`,
  },
}

// Mock fetch
const text = vi.fn()
const headers = { get: vi.fn() }
globalThis.fetch = vi.fn(() => Promise.resolve({ text, headers } as unknown as Response))

describe('File Component', () => {
  it('renders a local file path', async () => {
    text.mockResolvedValueOnce('test content')
    const source = getHyperparamSource('folder/subfolder/test.txt', { endpoint })
    assert(source?.kind === 'file')

    const { getByText } = await act(() => render(
      <ConfigProvider value={config}>
        <File source={source}/>
      </ConfigProvider>
    ))

    expect(getByText('/')).toBeDefined()
    expect(getByText('folder/')).toBeDefined()
    expect(getByText('subfolder/')).toBeDefined()
    expect(getByText('test.txt')).toBeDefined()
  })

  it('renders a URL', async () => {
    text.mockResolvedValueOnce('test content')
    const url = 'https://example.com/test.txt'
    const source = getHttpSource(url)
    assert(source?.kind === 'file')

    const { getAllByRole } = await act(() => render(
      <ConfigProvider value={config}>
        <File source={source} />
      </ConfigProvider>
    ))

    const links = getAllByRole('link')
    expect(links[0]?.getAttribute('href')).toBe('/')
    expect(links[1]?.getAttribute('href')).toBe('/files?key=https://example.com/')
    expect(links[2]?.getAttribute('href')).toBe('/files?key=https://example.com/test.txt')
  })

  it('renders correct breadcrumbs for nested folders', async () => {
    text.mockResolvedValueOnce('test content')
    const source = getHyperparamSource('folder1/folder2/folder3/test.txt', { endpoint })
    assert(source?.kind === 'file')

    const { getAllByRole } = await act(() => render(
      <ConfigProvider value={config}>
        <File source={source} />
      </ConfigProvider>
    ))

    const links = getAllByRole('link')
    expect(links[0]?.getAttribute('href')).toBe('/')
    expect(links[1]?.getAttribute('href')).toBe('/files?key=')
    expect(links[2]?.getAttribute('href')).toBe('/files?key=folder1/')
    expect(links[3]?.getAttribute('href')).toBe('/files?key=folder1/folder2/')
    expect(links[4]?.getAttribute('href')).toBe('/files?key=folder1/folder2/folder3/')
    expect(links[5]?.getAttribute('href')).toBe('/files?key=folder1/folder2/folder3/test.txt')
  })
})
