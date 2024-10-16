import { asyncBufferFromUrl, parquetQuery } from 'hyparquet'
import { compressors } from 'hyparquet-compressors'

self.onmessage = async ({ data }) => {
  const { metadata, asyncBuffer, rowStart, rowEnd, orderBy } = data
  const file = await asyncBufferFromUrl(asyncBuffer.url, asyncBuffer.byteLength)
  try {
    const result = await parquetQuery({
      metadata, file, rowStart, rowEnd, orderBy, compressors,
    })
    self.postMessage({ result })
  } catch (error) {
    self.postMessage({ error })
  }
}
