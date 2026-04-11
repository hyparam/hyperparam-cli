import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { WebSocket } from 'ws'
import { GetObjectCommand, HeadObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { parseS3Url } from './s3.js'
import { openUrl } from './serve.js'

/**
 * @import {WsRequestPayload, WsResponsePayload} from './types.js'
 */

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
})

/**
 * Start a client that connects to the hyperscope server
 * and handles incoming requests
 * @param {string} filePath - S3/HTTPS URL, or a local file path (relative or absolute)
 */
export async function scope(filePath) {
  /** @type {string | undefined} - set when serving from the local filesystem */
  let workingDir
  if (!/^(s3:\/\/|https?:\/\/)/.exec(filePath)) {
    // Local file: serve from cwd with the relative path as the key
    let stat
    try {
      stat = await fs.stat(filePath)
    } catch {
      console.error(`Error: file ${filePath} does not exist`)
      process.exit(1)
    }
    if (!stat.isFile()) {
      console.error(`Error: ${filePath} is not a file`)
      process.exit(1)
    }
    const absolutePath = await fs.realpath(filePath)
    workingDir = process.cwd()
    const relative = path.relative(workingDir, absolutePath)
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      console.error(`Error: ${filePath} must be inside the current directory`)
      process.exit(1)
    }
    filePath = relative
  }

  const connectionId = 'scope-' + randomUUID().replace(/-/g, '').slice(0, 12)
  const scopeOrigin = 'wss://scope.hyperparam.app'
  // const scopeOrigin = 'ws://localhost:4666'
  const url = `${scopeOrigin}/connect?connection_id=${connectionId}`

  console.log('Connecting to', scopeOrigin, connectionId)

  const ws = new WebSocket(url)

  ws.on('open', () => {
    const hyperparamBase = 'https://hyperparam.app/open?key='
    // Use provided S3 path or default to the hardcoded one
    const key = encodeURIComponent(`https://scope.hyperparam.app/scope/${connectionId}?key=${encodeURIComponent(filePath ?? '')}`)
    const url = `${hyperparamBase}${key}`
    console.log(`Hyperscope connected ${connectionId}\n`)
    openUrl(url)
  })

  ws.on('message', async (data) => {
    let request
    try {
      request = JSON.parse(data.toString())
    } catch (err) {
      console.error('Hyperscope failed to parse request:', err)
      return
    }

    // Handle the request and send a response
    console.log('Request ', request.request_id, request.type, request.key)
    try {
      const response = await handleRequest(request, workingDir)
      ws.send(JSON.stringify(response))
      console.log('Response', request.request_id, response.status, response.headers['Content-Length'])
    } catch (err) {
      console.error('Hyperscope error handling request:', err)
      // Send error response
      ws.send(JSON.stringify({
        request_id: request.request_id,
        error: err instanceof Error ? err.message : String(err),
      }))
    }
  })

  ws.on('error', (err) => {
    console.error('Hyperscope WebSocket error:', err.message)
  })

  ws.on('close', (code, reason) => {
    console.log(`Hyperscope connection closed (code: ${code}, reason: ${reason || 'none'})`)
    process.exit(0)
  })

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down hyperscope connection...')
    ws.close()
  })

  process.on('SIGTERM', () => {
    console.log('\nShutting down hyperscope connection...')
    ws.close()
  })
}

/**
 * Handle an incoming request from the server
 * @param {WsRequestPayload} request - The request object
 * @param {string} [workingDir] - Optional local directory to serve files from
 * @returns {Promise<WsResponsePayload>} The response to send back
 */
async function handleRequest(request, workingDir) {
  const { request_id, type, key } = request

  if (workingDir) {
    return handleLocalRequest(request, workingDir)
  }

  // Handle different request types
  if (type === 'get') {
    // Parse the S3 URL to extract bucket and key
    const { bucket, key: s3Key } = parseS3Url(key)

    // Check for Range header to support partial content requests
    let rangeHeader = request.headers?.['range'] || request.headers?.['Range']
    // Normalize to string if it's an array
    if (Array.isArray(rangeHeader)) {
      rangeHeader = rangeHeader[0]
    }

    // Fetch the object from S3
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: s3Key,
      ...rangeHeader && { Range: rangeHeader },
    })

    const response = await s3Client.send(command)

    // Convert the stream to a buffer
    const chunks = []
    if (response.Body) {
      // @ts-expect-error - Body is an async iterable stream
      for await (const chunk of response.Body) {
        chunks.push(chunk)
      }
    }
    const buffer = Buffer.concat(chunks)
    const body = buffer.toString('base64')

    // Determine status code (206 for partial content, 200 for full)
    const status = rangeHeader ? 206 : 200

    /** @type {Record<string, string>} */
    const headers = {}
    if (response.ContentType) {
      headers['Content-Type'] = response.ContentType
    }
    if (response.ContentLength !== undefined) {
      headers['Content-Length'] = String(response.ContentLength)
    }
    if (response.ETag) {
      headers['ETag'] = response.ETag
    }
    if (response.LastModified) {
      headers['Last-Modified'] = response.LastModified.toUTCString()
    }
    if (response.ContentRange) {
      headers['Content-Range'] = response.ContentRange
    }
    if (response.AcceptRanges) {
      headers['Accept-Ranges'] = response.AcceptRanges
    }

    return {
      request_id,
      type: 'response',
      status,
      headers,
      body,
    }
  } else if (type === 'head') {
    // Parse the S3 URL to extract bucket and key
    const { bucket, key: s3Key } = parseS3Url(key)

    // Get object metadata directly from S3
    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: s3Key,
    })

    const metadata = await s3Client.send(command)

    /** @type {Record<string, string>} */
    const headers = {}
    if (metadata.ContentLength !== undefined) {
      headers['Content-Length'] = String(metadata.ContentLength)
    }
    if (metadata.ContentType) {
      headers['Content-Type'] = metadata.ContentType
    }
    if (metadata.ETag) {
      headers['ETag'] = metadata.ETag
    }
    if (metadata.LastModified) {
      headers['Last-Modified'] = metadata.LastModified.toUTCString()
    }

    return {
      request_id,
      type: 'response',
      status: 200,
      headers,
      body: '',
    }
  } else {
    throw new Error(`Unknown request type: ${type}`)
  }
}

/**
 * Handle a request by reading from the local filesystem
 * @param {WsRequestPayload} request
 * @param {string} workingDir
 * @returns {Promise<WsResponsePayload>}
 */
async function handleLocalRequest(request, workingDir) {
  const { request_id, type, key } = request

  // Resolve key safely within workingDir
  const resolved = path.resolve(workingDir, key)
  const rel = path.relative(workingDir, resolved)
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error(`Access denied: ${key}`)
  }

  const stat = await fs.stat(resolved)
  const contentLength = stat.size

  /** @type {Record<string, string>} */
  const headers = {
    'Content-Length': String(contentLength),
    'Last-Modified': stat.mtime.toUTCString(),
    'Accept-Ranges': 'bytes',
  }

  if (type === 'head') {
    return { request_id, type: 'response', status: 200, headers, body: '' }
  }

  if (type !== 'get') {
    throw new Error(`Unknown request type: ${type}`)
  }

  let rangeHeader = request.headers?.['range'] || request.headers?.['Range']
  if (Array.isArray(rangeHeader)) rangeHeader = rangeHeader[0]

  /** @type {Buffer} */
  let buffer
  let status = 200
  if (rangeHeader) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader)
    if (!match) throw new Error(`Invalid Range header: ${rangeHeader}`)
    const startStr = match[1] ?? ''
    const endStr = match[2] ?? ''
    let start = startStr === '' ? 0 : parseInt(startStr, 10)
    let end = endStr === '' ? contentLength - 1 : parseInt(endStr, 10)
    if (startStr === '' && endStr !== '') {
      // suffix range: last N bytes
      start = Math.max(0, contentLength - parseInt(endStr, 10))
      end = contentLength - 1
    }
    if (start > end || start < 0 || end >= contentLength) {
      throw new Error(`Range not satisfiable: ${rangeHeader}`)
    }
    const length = end - start + 1
    buffer = Buffer.alloc(length)
    const handle = await fs.open(resolved, 'r')
    try {
      await handle.read(buffer, 0, length, start)
    } finally {
      await handle.close()
    }
    status = 206
    headers['Content-Length'] = String(length)
    headers['Content-Range'] = `bytes ${start}-${end}/${contentLength}`
  } else {
    buffer = await fs.readFile(resolved)
  }

  return {
    request_id,
    type: 'response',
    status,
    headers,
    body: buffer.toString('base64'),
  }
}
