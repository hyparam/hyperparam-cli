import { render } from '@testing-library/react'
import { strict as assert } from 'assert'
import React, { act } from 'react'
import { describe, expect, it, vi } from 'vitest'
import File from '../../src/components/File.js'
import { createHttpFileSystem, createHyperparamFileSystem } from '../../src/lib/filesystem.js'
import { RoutesConfig } from '../../src/lib/routes.js'
import { getSource } from '../../src/lib/source.js'

const hyparamFileSystem = createHyperparamFileSystem({ endpoint: 'http://localhost:3000' })
const httpFileSystem = createHttpFileSystem()


const config: RoutesConfig = {
  routes: {
    getSourceRouteUrl: ({ sourceId }) => `/files?key=${sourceId}`,
    getCellRouteUrl: ({ sourceId, col, row }) => `/files?key=${sourceId}&col=${col}&row=${row}`,
  },
}

// Mock fetch
global.fetch = vi.fn(() => Promise.resolve({ text: vi.fn() } as unknown as Response))

describe('File Component', () => {
  it('renders a local file path', async () => {
    const source = getSource('folder/subfolder/test.txt', hyparamFileSystem)
    assert(source?.kind === 'file')

    const { getByText } = await act(() => render(
      <File source={source} config={config}/>,
    ))

    expect(getByText('/')).toBeDefined()
    expect(getByText('folder/')).toBeDefined()
    expect(getByText('subfolder/')).toBeDefined()
    expect(getByText('test.txt')).toBeDefined()
  })

  it('renders a URL', async () => {
    const url = 'https://example.com/test.txt'
    const source = getSource(url, httpFileSystem)
    assert(source?.kind === 'file')

    const { getByText } = await act(() => render(<File source={source} />))

    expect(getByText(url)).toBeDefined()
  })

  it('renders correct breadcrumbs for nested folders', async () => {
    const source = getSource('folder1/folder2/folder3/test.txt', hyparamFileSystem)
    assert(source?.kind === 'file')

    const { getAllByRole } = await act(() => render(
      <File source={source} config={config} />,
    ))

    const links = getAllByRole('link')
    expect(links[0].getAttribute('href')).toBe('/')
    expect(links[1].getAttribute('href')).toBe('/files?key=')
    expect(links[2].getAttribute('href')).toBe('/files?key=folder1/')
    expect(links[3].getAttribute('href')).toBe('/files?key=folder1/folder2/')
    expect(links[4].getAttribute('href')).toBe('/files?key=folder1/folder2/folder3/')
    expect(links[5].getAttribute('href')).toBe('/files?key=folder1/folder2/folder3/test.txt')
  })
})
