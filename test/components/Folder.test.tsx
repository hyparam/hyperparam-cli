import { fireEvent, render, waitFor } from '@testing-library/react'
import { strict as assert } from 'assert'
import React, { act } from 'react'
import { describe, expect, it, test, vi } from 'vitest'
import { Config, ConfigProvider } from '../../src/hooks/useConfig.js'
import { DirSource, FileMetadata, Folder, HyperparamFileMetadata, getHyperparamSource } from '../../src/index.js'

const endpoint = 'http://localhost:3000'
const mockFiles: HyperparamFileMetadata[] = [
  { key: 'folder1/', lastModified: '2022-01-01T12:00:00Z' },
  { key: 'file1.txt', fileSize: 8196, lastModified: '2023-01-01T12:00:00Z' },
]

const config: Config = {
  routes: {
    getSourceRouteUrl: ({ sourceId }) => `/files?key=${sourceId}`,
  },
}

globalThis.fetch = vi.fn()

describe('Folder Component', () => {
  test.for([
    '',
    'subfolder/',
  ])('fetches file data and displays files on mount', async (path) => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: () => Promise.resolve(mockFiles),
      ok: true,
    } as Response)

    const source = getHyperparamSource(path, { endpoint })
    assert(source?.kind === 'directory')

    const { findByText, getByText } = render(
      <ConfigProvider value={config}>
        <Folder source={source} />
      </ConfigProvider>)

    const folderLink = await findByText('folder1/')
    expect(folderLink.closest('a')?.getAttribute('href')).toBe(`/files?key=${path}folder1/`)

    expect(getByText('/')).toBeDefined()

    const fileLink = getByText('file1.txt')
    expect(fileLink.closest('a')?.getAttribute('href')).toBe(`/files?key=${path}file1.txt`)
    expect(getByText('8.0 kb')).toBeDefined()
    expect(getByText('1/1/2023')).toBeDefined()
  })

  it('displays the spinner while loading', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      // resolve in 50ms
      json: () => new Promise(resolve => setTimeout(() => { resolve([]) }, 50)),
      ok: true,
    } as Response)

    const source = getHyperparamSource('', { endpoint })
    assert(source?.kind === 'directory')

    const { getByText } = await act(() => render(<Folder source={source} />))
    const spinner = getByText('Loading...')
    expect(spinner).toBeDefined()
  })

  it('handles file listing errors', async () => {
    const errorMessage = 'Failed to fetch'
    vi.mocked(fetch).mockResolvedValueOnce({
      text: () => Promise.resolve(errorMessage),
      ok: false,
    } as Response)

    const source = getHyperparamSource('test-prefix/', { endpoint })
    assert(source?.kind === 'directory')

    const { findByText, queryByText } = render(<Folder source={source} />)

    await waitFor(() => { expect(fetch).toHaveBeenCalled() })

    await findByText('Error: ' + errorMessage)
    expect(queryByText('file1.txt')).toBeNull()
    expect(queryByText('folder1/')).toBeNull()
  })

  it('filters files based on search query', async () => {
    const mockFiles: FileMetadata[] = [
      { sourceId: 'folder1', name: 'folder1/', kind: 'directory', lastModified: '2023-01-01T00:00:00Z' },
      { sourceId: 'file1.txt', name: 'file1.txt', kind: 'file', size: 8196, lastModified: '2023-01-01T00:00:00Z' },
      { sourceId: 'report.pdf', name: 'report.pdf', kind: 'file', size: 10240, lastModified: '2023-01-02T00:00:00Z' },
    ]
    const dirSource: DirSource = {
      sourceId: 'test-source',
      sourceParts: [{ text: 'test-source', sourceId: 'test-source' }],
      kind: 'directory',
      prefix: '',
      listFiles: () => Promise.resolve(mockFiles),
    }
    const { getByPlaceholderText, getByText, queryByText } = render(<Folder source={dirSource} />)

    // Type a search query
    const searchInput = getByPlaceholderText('Search...') as HTMLInputElement
    act(() => {
      fireEvent.keyUp(searchInput, { target: { value: 'file1' } })
    })

    // Only matching files are displayed
    await waitFor(() => {
      expect(getByText('file1.txt')).toBeDefined()
      expect(queryByText('folder1/')).toBeNull()
      expect(queryByText('report.pdf')).toBeNull()
    })

    // Clear search with escape key
    act(() => {
      fireEvent.keyUp(searchInput, { key: 'Escape' })
    })

    await waitFor(() => {
      expect(getByText('file1.txt')).toBeDefined()
      expect(getByText('folder1/')).toBeDefined()
      expect(getByText('report.pdf')).toBeDefined()
    })
  })

  it('hitting enter on single search result navigates to file', async () => {
    // Mock location.href
    const location = { href: '' }
    Object.defineProperty(window, 'location', {
      writable: true,
      value: location,
    })
    const mockFiles: FileMetadata[] = [
      { sourceId: 'file1.txt', name: 'file1.txt', kind: 'file', size: 8196, lastModified: '2023-01-01T00:00:00Z' },
      { sourceId: 'file2.txt', name: 'file2.txt', kind: 'file', size: 4096, lastModified: '2023-02-02T00:00:00Z' },
    ]
    const dirSource: DirSource = {
      sourceId: 'test-source',
      sourceParts: [{ text: 'test-source', sourceId: 'test-source' }],
      kind: 'directory',
      prefix: '',
      listFiles: () => Promise.resolve(mockFiles),
    }
    const { getByPlaceholderText, getByText } = render(<Folder source={dirSource} />)

    // Type a search query and hit enter
    const searchInput = getByPlaceholderText('Search...') as HTMLInputElement
    act(() => {
      fireEvent.keyUp(searchInput, { target: { value: 'file1' } })
    })

    await waitFor(() => {
      expect(getByText('file1.txt')).toBeDefined()
    })

    act(() => {
      fireEvent.keyUp(searchInput, { key: 'Enter' })
    })

    expect(location.href).toBe('/files?key=file1.txt')
  })

  it('jumps to search box when user types /', async () => {
    const dirSource: DirSource = {
      sourceId: 'test-source',
      sourceParts: [{ text: 'test-source', sourceId: 'test-source' }],
      kind: 'directory',
      prefix: '',
      listFiles: () => Promise.resolve([]),
    }
    const { getByPlaceholderText } = render(<Folder source={dirSource} />)

    // Wait for component to settle
    await waitFor(() => {
      expect(fetch).toHaveBeenCalled()
    })

    const searchInput = getByPlaceholderText('Search...') as HTMLInputElement

    // Typing / should focus the search box
    act(() => {
      fireEvent.keyDown(document.body, { key: '/' })
    })
    expect(document.activeElement).toBe(searchInput)

    // Typing inside the search box should work including /
    act(() => {
      fireEvent.keyUp(searchInput, { target: { value: 'file1/' } })
    })
    expect(searchInput.value).toBe('file1/')

    // Unfocus and re-focus should select all text in search box
    act(() => {
      searchInput.blur()
    })
    expect(document.activeElement).not.toBe(searchInput)

    act(() => {
      fireEvent.keyDown(document.body, { key: '/' })
    })
    expect(document.activeElement).toBe(searchInput)
    expect(searchInput.selectionStart).toBe(0)
    expect(searchInput.selectionEnd).toBe(searchInput.value.length)
  })
})
