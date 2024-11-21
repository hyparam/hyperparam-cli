/**
 * Pipe a web ReadableStream to a node Writable.
 * @typedef {import('stream').Writable} Writable
 * @param {ReadableStream} input
 * @param {Writable} output
 * @returns {Promise<void>}
 */
export async function pipe(input, output) {
  // TODO: typescript hates for-await? should just be:
  // for await (const chunk of input) {}
  const reader = input.getReader()
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    output.write(value)
  }
  output.end()
}

/**
 * Convert a node fs ReadStream to a web ReadableStream.
 * @typedef {import('fs').ReadStream} ReadStream
 * @param {ReadStream} fsStream
 * @returns {ReadableStream}
 */
export function readStreamToReadableStream(fsStream) {
  return new ReadableStream({
    start(/** @type {ReadableStreamDefaultController} */ controller) {
      fsStream.on('data', (chunk) => controller.enqueue(chunk))
      fsStream.on('end', () => controller.close())
      fsStream.on('error', (error) => controller.error(error))
    },
    cancel() {
      fsStream.destroy()
    },
  })
}
