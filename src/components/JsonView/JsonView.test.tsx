import { render, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FileSource } from '../../lib/sources/types.js'
import JsonView from './JsonView.js'

vi.mock('../../../src/lib/utils.js', async () => {
  const actual = await vi.importActual('../../../src/lib/utils.js')
  return { ...actual, asyncBufferFrom: vi.fn() }
})

globalThis.fetch = vi.fn()

describe('JsonView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const encoder = new TextEncoder()

  it('renders json content as nested tree items (if not collapsed)', async () => {
    const text = '{"key":["value"]}'
    const body = encoder.encode(text).buffer
    const source: FileSource = {
      resolveUrl: 'testKey0',
      kind: 'file',
      fileName: 'testKey0',
      sourceId: 'testKey0',
      sourceParts: [],
    }
    vi.mocked(fetch).mockResolvedValueOnce({
      status: 200,
      headers: new Headers({ 'Content-Length': body.byteLength.toString() }),
      text: () => Promise.resolve(text),
    } as Response)

    const { findAllByRole, findByText } = render(
      <JsonView source={source} setError={console.error} />
    )

    expect(fetch).toHaveBeenCalledWith('testKey0', undefined)
    // Wait for asynchronous JSON loading and parsing
    await findAllByRole('treeitem')
    await findByText('key:')
    await findByText('"value"')
  })

  it('displays an error when the json content is too long', async () => {
    const source: FileSource = {
      sourceId: 'testKey1',
      sourceParts: [],
      kind: 'file',
      fileName: 'testKey1',
      resolveUrl: 'testKey1',
    }
    vi.mocked(fetch).mockResolvedValueOnce({
      status: 200,
      headers: new Headers({ 'Content-Length': '8000001' }),
      text: () => Promise.resolve(''),
    } as Response)

    const setError = vi.fn()
    render(<JsonView source={source} setError={setError} />)

    expect(fetch).toHaveBeenCalledWith('testKey1', undefined)
    await waitFor(() => {
      expect(setError).toHaveBeenCalledWith(expect.objectContaining({
        message: 'File is too large to display',
      }))
    })
  })

  it('displays an error when the json content is invalid', async () => {
    const body = encoder.encode('INVALIDJSON').buffer
    const source: FileSource = {
      resolveUrl: 'testKey2',
      kind: 'file',
      fileName: 'testKey2',
      sourceId: 'testKey2',
      sourceParts: [],
    }
    vi.mocked(fetch).mockResolvedValueOnce({
      status: 200,
      headers: new Headers({ 'Content-Length': body.byteLength.toString() }),
      text: () => Promise.resolve('INVALIDJSON'),
    } as Response)

    const setError = vi.fn()
    render(<JsonView source={source} setError={setError} />)

    expect(fetch).toHaveBeenCalledWith('testKey2', undefined)
    await waitFor(() => {
      expect(setError).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Unexpected token') as string,
      }))
    })
  })

  it('displays an error when unauthorized', async () => {
    const source: FileSource = {
      resolveUrl: 'testKey3',
      kind: 'file',
      fileName: 'testKey3',
      sourceId: 'testKey3',
      sourceParts: [],
    }
    vi.mocked(fetch).mockResolvedValueOnce({
      status: 401,
      text: () => Promise.resolve('Unauthorized'),
    } as Response)

    const setError = vi.fn()
    render(<JsonView source={source} setError={setError} />)

    expect(fetch).toHaveBeenCalledWith('testKey3', undefined)
    await waitFor(() => {
      expect(setError).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Unauthorized',
      }))
    })
  })
})
