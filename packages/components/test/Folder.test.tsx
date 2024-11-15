import { FileMetadata, listFiles, parseKey } from '@hyparam/utils'
import { render, waitFor } from '@testing-library/react'
import { strict as assert } from 'assert'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import Folder from '../src/Folder.js'

vi.mock('../../src/lib/files.js', () => ({
  listFiles: vi.fn(),
  getFileDate: vi.fn((f: FileMetadata) => f.lastModified),
  getFileDateShort: vi.fn((f: FileMetadata) => f.lastModified),
  getFileSize: vi.fn((f: FileMetadata) => f.fileSize),
}))

const mockFiles: FileMetadata[] = [
  { key: 'folder1/', lastModified: '2023-01-01T00:00:00Z' },
  { key: 'file1.txt', fileSize: 8196, lastModified: '2023-01-01T00:00:00Z' },
]

describe('Folder Component', () => {
  it('fetches file data and displays files on mount', async () => {
    vi.mocked(listFiles).mockResolvedValueOnce(mockFiles)
    const folderKey = parseKey('')
    assert(folderKey.kind === 'folder')
    const { findByText, getByText } = render(<Folder folderKey={folderKey} />)

    await waitFor(() => {expect(listFiles).toHaveBeenCalledWith('')})

    const folderLink = await findByText('folder1/')
    expect(folderLink.closest('a')?.getAttribute('href')).toBe('/files?key=folder1/')

    expect(getByText('/')).toBeDefined()

    const fileLink = getByText('file1.txt')
    expect(fileLink.closest('a')?.getAttribute('href')).toBe('/files?key=file1.txt')
    expect(getByText('8196')).toBeDefined()
    expect(getByText('2023-01-01T00:00:00Z')).toBeDefined()
  })

  it('displays the spinner while loading', () => {
    vi.mocked(listFiles).mockReturnValue(new Promise(() => []))
    const folderKey = parseKey('test-prefix/')
    assert(folderKey.kind === 'folder')
    const { container } = render(<Folder folderKey={folderKey} />)
    expect(container.querySelector('.spinner')).toBeDefined()
  })

  it('handles file listing errors', async () => {
    const errorMessage = 'Failed to fetch'
    vi.mocked(listFiles).mockRejectedValue(new Error(errorMessage))
    const folderKey = parseKey('test-prefix/')
    assert(folderKey.kind === 'folder')
    const { findByText, queryByText } = render(<Folder folderKey={folderKey} />)

    await waitFor(() => { expect(listFiles).toHaveBeenCalled() })

    await findByText('Error: ' + errorMessage)
    expect(queryByText('file1.txt')).toBeNull()
    expect(queryByText('folder1/')).toBeNull()
  })

  it('renders breadcrumbs correctly', async () => {
    vi.mocked(listFiles).mockResolvedValue(mockFiles)
    const folderKey = parseKey('subdir1/subdir2/')
    assert(folderKey.kind === 'folder')
    const { findByText, getByText } = render(<Folder folderKey={folderKey} />)
    await waitFor(() => { expect(listFiles).toHaveBeenCalled() })

    const subdir1Link = await findByText('subdir1/')
    expect(subdir1Link.closest('a')?.getAttribute('href')).toBe('/files?key=subdir1/')

    const subdir2Link = getByText('subdir2/')
    expect(subdir2Link.closest('a')?.getAttribute('href')).toBe('/files?key=subdir1/subdir2/')
  })
})
