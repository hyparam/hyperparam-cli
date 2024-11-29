import { render, waitFor } from '@testing-library/react'
import { strict as assert } from 'assert'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import Folder from '../../src/components/Folder.js'
import { HyparamFileMetadata, HyparamFileSystem } from '../../src/lib/filesystem.js'
import { RoutesConfig } from '../../src/lib/routes.js'

const hyparamFileSystem = new HyparamFileSystem({ endpoint: 'http://localhost:3000' })
// hyparamFileSystem._fetchFilesList = () => Promise.resolve([
//   { key: 'folder1/', lastModified: '2023-01-01T00:00:00Z' },
//   { key: 'file1.txt', fileSize: 8196, lastModified: '2023-01-01T00:00:00Z' },
// ])

const mockFiles: HyparamFileMetadata[] = [
  { key: 'folder1/', lastModified: '2023-01-01T00:00:00Z' },
  { key: 'file1.txt', fileSize: 8196, lastModified: '2023-01-01T00:00:00Z' },
]

const config: RoutesConfig = {
  routes: {
    getSourceRouteUrl: ({ source }) => `/files?key=${source}`,
  },
}

global.fetch = vi.fn()

describe('Folder Component', () => {
  it('fetches file data and displays files on mount', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: () => Promise.resolve(mockFiles),
      ok: true,
    } as Response)

    const source = hyparamFileSystem.getSource('')
    assert(source?.kind === 'directory')

    const { findByText, getByText } = render(<Folder source={source} config={config} />)

    const folderLink = await findByText('folder1/')
    expect(folderLink.closest('a')?.getAttribute('href')).toBe('/files?key=folder1/')

    expect(getByText('/')).toBeDefined()

    const fileLink = getByText('file1.txt')
    expect(fileLink.closest('a')?.getAttribute('href')).toBe('/files?key=file1.txt')
    expect(getByText('8.0 kb')).toBeDefined()
    expect(getByText('1/1/2023')).toBeDefined()
  })

  it('displays the spinner while loading', () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: () => Promise.resolve([]),
      ok: true,
    } as Response)

    const source = hyparamFileSystem.getSource('')
    assert(source?.kind === 'directory')

    const { container } = render(<Folder source={source} />)
    expect(container.querySelector('.spinner')).toBeDefined()
  })

  it('handles file listing errors', async () => {
    const errorMessage = 'Failed to fetch'
    vi.mocked(fetch).mockResolvedValueOnce({
      text: () => Promise.resolve(errorMessage),
      ok: false,
    } as Response)

    const source = hyparamFileSystem.getSource('test-prefix/')
    assert(source?.kind === 'directory')

    const { findByText, queryByText } = render(<Folder source={source} />)

    await waitFor(() => { expect(fetch).toHaveBeenCalled() })

    await findByText('Error: ' + errorMessage)
    expect(queryByText('file1.txt')).toBeNull()
    expect(queryByText('folder1/')).toBeNull()
  })

  it('renders breadcrumbs correctly', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: () => Promise.resolve(mockFiles),
      ok: true,
    } as Response)

    const source = hyparamFileSystem.getSource('subdir1/subdir2/')
    assert(source?.kind === 'directory')

    const { findByText, getByText } = render(<Folder source={source} config={config} />)
    await waitFor(() => { expect(fetch).toHaveBeenCalled() })

    const subdir1Link = await findByText('subdir1/')
    expect(subdir1Link.closest('a')?.getAttribute('href')).toBe('/files?key=subdir1/')

    const subdir2Link = getByText('subdir2/')
    expect(subdir2Link.closest('a')?.getAttribute('href')).toBe('/files?key=subdir1/subdir2/')
  })
})
