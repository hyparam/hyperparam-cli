import { render } from '@testing-library/react'
import React from 'react'
import { describe, expect, it } from 'vitest'
import File from '../../src/components/File.js'

describe('File Component', () => {
  it('renders a local file path', () => {
    const { getByText } = render(<File file="folder/subfolder/test.txt" />)

    expect(getByText('/')).toBeDefined()
    expect(getByText('folder/')).toBeDefined()
    expect(getByText('subfolder/')).toBeDefined()
    expect(getByText('test.txt')).toBeDefined()
  })

  it('renders a URL', () => {
    const url = 'https://example.com/test.txt'
    const { getByText } = render(<File file={url} />)

    expect(getByText(url)).toBeDefined()
  })

  it('renders correct breadcrumbs for nested folders', () => {
    const { getAllByRole } = render(<File file="folder1/folder2/folder3/test.txt" />)

    const links = getAllByRole('link')
    expect(links[0].getAttribute('href')).toBe('/')
    expect(links[1].getAttribute('href')).toBe('/files')
    expect(links[2].getAttribute('href')).toBe('/files?key=folder1/')
    expect(links[3].getAttribute('href')).toBe('/files?key=folder1/folder2/')
    expect(links[4].getAttribute('href')).toBe('/files?key=folder1/folder2/folder3/')
    expect(links[5].getAttribute('href')).toBe('/files?key=folder1/folder2/folder3/test.txt')
  })
})
