import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import * as fs from 'fs/promises'
import path from 'path'
import { handleListing } from '../src/serve.js'

const tempDir = path.join(__dirname, 'temp-test-dir')

describe('handleListing', () => {
  const testFiles = [
    { name: '.dotfile.txt', type: 'file', content: 'Dot file content' },
    { name: 'dir1', type: 'dir' },
    { name: 'file.txt', type: 'file', content: 'File content' },
    { name: '@specialFolder', type: 'dir' },
    { name: 'dir2', type: 'dir' },
    { name: 'Unicode_文件.txt', type: 'file', content: 'Unicode file content' },
    { name: 'app.jsx', type: 'file', content: 'File content' },
  ]

  beforeAll(async () => {
    await fs.mkdir(tempDir, { recursive: true })
    for (const file of testFiles) {
      const filePath = path.join(tempDir, file.name)
      if (file.type === 'dir') await fs.mkdir(filePath)
      else await fs.writeFile(filePath, file.content || '')
    }
  })

  afterAll(async () => {
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  it('should return directories before files in case-insensitive alphabetical order', async () => {
    const result = await handleListing(tempDir)
    if (typeof result.content !== 'string') {
      throw new Error('Expected result.content to be a string')
    }

    /**
     * Parsed entries from the result.
     * @type {{ key: string, fileSize?: number, lastModified: string }[]}
     */
    const entries = JSON.parse(result.content)
    const keys = entries.map((entry) => entry.key)
    const expectedKeys = [
      '@specialFolder/',
      'dir1/',
      'dir2/',
      '.dotfile.txt',
      'app.jsx',
      'file.txt',
      'Unicode_文件.txt',
    ]

    expect(keys).toEqual(expectedKeys)
  })
})
