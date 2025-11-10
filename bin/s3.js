/**
 * Parse an S3 URL into bucket and key components
 * @param {string} url - S3 URL in format:
 *   - s3://bucket/key
 *   - https://bucket.s3.amazonaws.com/key
 *   - https://s3.amazonaws.com/bucket/key
 *   - https://bucket.s3.region.amazonaws.com/key
 * @returns {{bucket: string, key: string}} Object with bucket and key
 * @throws {Error} If URL format is invalid
 */
export function parseS3Url(url) {
  if (!url || typeof url !== 'string') {
    throw new Error('Invalid S3 URL: URL must be a non-empty string')
  }

  // Handle s3:// protocol
  if (url.startsWith('s3://')) {
    const withoutProtocol = url.slice(5) // Remove 's3://'
    const firstSlashIndex = withoutProtocol.indexOf('/')

    if (firstSlashIndex === -1) {
      throw new Error('Invalid S3 URL: Missing key after bucket name')
    }

    const bucket = withoutProtocol.slice(0, firstSlashIndex)
    const key = withoutProtocol.slice(firstSlashIndex + 1)

    if (!bucket) {
      throw new Error('Invalid S3 URL: Empty bucket name')
    }

    if (!key) {
      throw new Error('Invalid S3 URL: Empty key')
    }

    return { bucket, key }
  }

  // Handle https:// protocol
  if (url.startsWith('https://') || url.startsWith('http://')) {
    const urlObj = new URL(url)
    const { hostname } = urlObj
    const pathname = urlObj.pathname.startsWith('/')
      ? urlObj.pathname.slice(1)
      : urlObj.pathname

    if (!pathname) {
      throw new Error('Invalid S3 URL: Missing key in path')
    }

    // Virtual-hosted-style URL: https://bucket.s3.amazonaws.com/key
    // or https://bucket.s3.region.amazonaws.com/key
    if (hostname.includes('.s3.') || hostname.includes('.s3-')) {
      const bucket = hostname.split('.')[0]
      const key = pathname

      if (!bucket) {
        throw new Error('Invalid S3 URL: Empty bucket name')
      }

      return { bucket, key }
    }

    // Path-style URL: https://s3.amazonaws.com/bucket/key
    // or https://s3.region.amazonaws.com/bucket/key
    if (hostname.startsWith('s3.') || hostname.startsWith('s3-') || hostname === 's3.amazonaws.com') {
      const firstSlashIndex = pathname.indexOf('/')

      if (firstSlashIndex === -1) {
        // pathname is just the bucket with no key
        throw new Error('Invalid S3 URL: Missing key after bucket name')
      }

      const bucket = pathname.slice(0, firstSlashIndex)
      const key = pathname.slice(firstSlashIndex + 1)

      if (!bucket) {
        throw new Error('Invalid S3 URL: Empty bucket name')
      }

      if (!key) {
        throw new Error('Invalid S3 URL: Empty key')
      }

      return { bucket, key }
    }

    throw new Error('Invalid S3 URL: Hostname does not match S3 URL patterns')
  }

  throw new Error('Invalid S3 URL: Must start with s3:// or https://')
}
