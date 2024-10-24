import { render, waitFor } from '@testing-library/react'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import Folder from '../../src/components/Folder.js'
import { FileMetadata, listFiles } from '../../src/files.js'

vi.mock('../../src/files.js', () => ({
  listFiles: vi.fn(),
  getFileDate: vi.fn(f => f.lastModified),
  getFileDateShort: vi.fn(f => f.lastModified),
  getFileSize: vi.fn(f => f.fileSize),
}))

const mockFiles: FileMetadata[] = [
  { key: 'folder1/', lastModified: '2023-01-01T00:00:00Z' },
  { key: 'file1.txt', fileSize: 8196, lastModified: '2023-01-01T00:00:00Z' },
]

describe('Folder Component', () => {
  it('fetches file data and displays files on mount', async () => {
    vi.mocked(listFiles).mockResolvedValueOnce(mockFiles)
    const { getByText } = render(<Folder prefix="" />)

    await waitFor(() => expect(listFiles).toHaveBeenCalledWith(''))

    expect(getByText('/')).toBeDefined()

    const folderLink = getByText('folder1/')
    expect(folderLink.closest('a')?.getAttribute('href')).toBe('/files?key=folder1/')

    const fileLink = getByText('file1.txt')
    expect(fileLink.closest('a')?.getAttribute('href')).toBe('/files?key=file1.txt')
    expect(getByText('8196')).toBeDefined()
    expect(getByText('2023-01-01T00:00:00Z')).toBeDefined()
  })

  it('displays the spinner while loading', () => {
    vi.mocked(listFiles).mockReturnValue(new Promise(() => {}))
    const { container } = render(<Folder prefix="test-prefix" />)
    expect(container.querySelector('.spinner')).toBeDefined()
  })

  it('handles file listing errors', async () => {
    const errorMessage = 'Failed to fetch'
    vi.mocked(listFiles).mockRejectedValue(new Error(errorMessage))
    const { getByText, queryByText } = render(<Folder prefix="test-prefix" />)

    await waitFor(() => expect(listFiles).toHaveBeenCalled())

    expect(queryByText('file1.txt')).toBeNull()
    expect(queryByText('folder1/')).toBeNull()
    expect(getByText('Error: ' + errorMessage)).toBeDefined()
  })

  it('renders breadcrumbs correctly', async () => {
    vi.mocked(listFiles).mockResolvedValue(mockFiles)
    const { getByText } = render(<Folder prefix="subdir1/subdir2" />)
    await waitFor(() => expect(listFiles).toHaveBeenCalled())

    const subdir1Link = getByText('subdir1/')
    expect(subdir1Link.closest('a')?.getAttribute('href')).toBe('/files?key=subdir1/')

    const subdir2Link = getByText('subdir2/')
    expect(subdir2Link.closest('a')?.getAttribute('href')).toBe('/files?key=subdir1/subdir2/')
  })
})
