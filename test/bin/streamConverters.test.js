import { PassThrough, Writable } from 'stream'
import { describe, expect, it } from 'vitest'
import {
  pipe,
  readStreamToReadableStream,
} from '../../bin/streamConverters.js'

describe('pipe', () => {
  it('should pipe data from web ReadableStream to a Writable', async () => {
    const inputString = 'Test data for pipe function'
    const inputReadableStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(inputString))
        controller.close()
      },
    })

    let outputString = ''
    const outputWritableStream = new Writable({
      write(chunk, encoding, callback) {
        outputString += chunk.toString()
        callback()
      },
    })

    await pipe(inputReadableStream, outputWritableStream)
    expect(outputString).toBe(inputString)
  })
})

describe('readStreamToReadableStream', () => {
  it('should convert node ReadStream to web ReadableStream', async () => {
    const mockData = 'Test data for readStreamToReadableStream function'
    const passThroughStream = new PassThrough()

    // Simulate data being written to the stream
    passThroughStream.write(mockData)
    passThroughStream.end()

    // @ts-expect-error: PassThrough is a ReadStream?
    const readableStream = readStreamToReadableStream(passThroughStream)
    const reader = readableStream.getReader()

    let result = ''
    let chunk
    while (!(chunk = await reader.read()).done) {
      result += new TextDecoder().decode(chunk.value)
    }

    expect(result).toBe(mockData)
  })
})
