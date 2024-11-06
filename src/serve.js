/**
 * Dependency-free http server for serving static files
 */

import { exec } from 'child_process'
import { createReadStream } from 'fs'
import fs from 'fs/promises'
import http from 'http'
import path from 'path'
import url from 'url'
import zlib from 'zlib'
import { pipe, readStreamToReadableStream } from './streamConverters.js'

/** @type {Object<string, string>} */
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.csv': 'text/csv',
  '.json': 'application/json',
  '.map': 'application/json',
  '.md': 'text/markdown',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.parquet': 'application/x-parquet',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
}

/**
 * @template T
 * @typedef {T | Promise<T>} Awaitable<T>
 */

/**
 * Start http server with optional path
 * @param {string | undefined} serveDirectory serve files from this directory
 * @param {string | undefined} key file to serve by default
 */
export async function serve(serveDirectory, key) {
  // Search for open port
  let port = 2048
  while (port < 2048 + 10) {
    try {
      await startServer(port, serveDirectory)
      break
    } catch (/** @type {any} */ err) {
      if (err.code !== 'EADDRINUSE') throw err
      console.error(`port ${port} in use, trying next port`)
      if (port === 2048) port++ // skip unsafe nfs port 2049
      port++
    }
  }
  console.log(`hyperparam server running on http://localhost:${port}`)
  if (!key) openUrl(`http://localhost:${port}`)
  else {
    key = encodeURIComponent(key)
    openUrl(`http://localhost:${port}/files?key=${key}`)
  }
}

/**
 * Route an http request
 * @typedef {Object} ReadableStream
 * @typedef {{ status: number, content: string | Buffer | ReadableStream, contentLength?: number, contentType?: string }} ServeResult
 * @param {http.IncomingMessage} req
 * @param {string | undefined} serveDirectory
 * @returns {Awaitable<ServeResult>}
 */
function handleRequest(req, serveDirectory) {
  if (!req.url) return { status: 400, content: 'bad request' }
  const parsedUrl = url.parse(req.url, true)
  const pathname = parsedUrl.pathname || ''

  // get location of hyperparam assets
  const hyperparamPath = import.meta.url
    .replace('file://', '')
    .replace('/src/serve.js', '')

  if (pathname === '/' || pathname === '/files/') {
    // redirect to /files
    return { status: 301, content: '/files' }
  } else if (pathname.startsWith('/files')) {
    // serve index.html
    return handleStatic(`${hyperparamPath}/public/index.html`)
  } else if (pathname.startsWith('/public/')) {
    // serve static files
    return handleStatic(`${hyperparamPath}${pathname}`)
  } else if (serveDirectory && pathname === '/api/store/list') {
    // serve file list
    const prefix = parsedUrl.query.prefix || ''
    if (Array.isArray(prefix)) return { status: 400, content: 'bad request' }
    const perfixPath = `${serveDirectory}/${prefix}`
    return handleListing(perfixPath)
  } else if (serveDirectory && pathname === '/api/store/get') {
    // serve file content
    const key = parsedUrl.query.key || ''
    if (Array.isArray(key)) return { status: 400, content: 'bad request' }
    const filePath = `${serveDirectory}/${key}`
    if (req.method === 'HEAD') {
      return handleHead(filePath)
    }
    const range = req.method === 'HEAD' ? '0-0' : req.headers.range
    return handleStatic(filePath, range)
  } else {
    return { status: 404, content: 'not found' }
  }
}

/**
 * Serve static file from the serve directory
 * @param {string} filePath
 * @param {string} [range]
 * @returns {Promise<ServeResult>}
 */
async function handleStatic(filePath, range) {
  const stats = await fs.stat(filePath).catch(() => undefined)
  if (!stats || !stats.isFile()) {
    return { status: 404, content: 'not found' }
  }
  const contentLength = stats.size

  // detect content type
  const extname = path.extname(filePath)
  if (!mimeTypes[extname]) console.error(`serving unknown mimetype ${extname}`)
  const contentType = mimeTypes[extname] || 'application/octet-stream'

  // ranged requests
  if (range) {
    const [unit, ranges] = range.split('=')
    if (unit === 'bytes') {
      const [start, end] = ranges.split('-').map(Number)

      // convert fs.ReadStream to web stream
      const fsStream = createReadStream(filePath, { start, end })
      const content = readStreamToReadableStream(fsStream)
      const contentLength = end - start + 1

      return {
        status: 206,
        content,
        contentLength,
        contentType,
      }
    }
  }

  const content = await fs.readFile(filePath)
  return { status: 200, content, contentLength, contentType }
}

/**
 * Serve head request
 * @param {string} filePath
 * @returns {Promise<ServeResult>}
 */
async function handleHead(filePath) {
  const stats = await fs.stat(filePath).catch(() => undefined)
  if (!stats || !stats.isFile()) {
    console.error(`file not found ${filePath}`)
    return { status: 404, content: 'not found' }
  }
  const contentLength = stats.size

  // detect content type
  const extname = path.extname(filePath)
  if (!mimeTypes[extname]) console.error(`serving unknown mimetype ${extname}`)
  const contentType = mimeTypes[extname] || 'application/octet-stream'

  return { status: 200, content: '', contentLength, contentType }
}

/**
 * List files from local storage
 *
 * @param {string} prefix file path prefix
 * @returns {Promise<ServeResult>}
 */
async function handleListing(prefix) {
  try {
    const stat = await fs.stat(prefix)
    if (!stat.isDirectory()) return { status: 400, content: 'not a directory' }
  } catch {
    return { status: 404, content: 'not found' }
  }

  const files = []
  for (const filename of await fs.readdir(prefix, { recursive: false })) {
    // get stats for each file
    const filePath = `${prefix}/${filename}`
    const stat = await fs.stat(filePath)
      .catch(() => undefined) // handle bad symlinks

    if (stat?.isFile()) {
      files.push({
        key: filename,
        fileSize: stat.size,
        lastModified: stat.mtime.toISOString(),
      })
    } else if (stat?.isDirectory()) {
      files.push({
        key: filename + '/',
        lastModified: stat.mtime.toISOString(),
      })
    }
  }

  return { status: 200, content: JSON.stringify(files), contentType: 'application/json' }
}

/**
 * @param {number} port
 * @param {string | undefined} path serve files from this directory
 * @returns {Promise<void>}
 */
function startServer(port, path) {
  return new Promise((resolve, reject) => {
    // create http server
    const server = http.createServer(async (req, res) => {
      const startTime = new Date()

      // handle request
      /** @type {ServeResult} */
      let result = { status: 500, content: 'internal server error' }
      try {
        result = await handleRequest(req, path)
      } catch (err) {
        console.error('error handling request', err)
      }
      const { status } = result
      let { content } = result

      // write http header
      /** @type {http.OutgoingHttpHeaders} */
      const headers = { 'Connection': 'keep-alive' }
      if (result.contentLength !== undefined) {
        headers['Content-Length'] = result.contentLength
      }
      if (result.contentType) headers['Content-Type'] = result.contentType
      if (status === 301 && typeof content === 'string') {
        // handle redirect
        headers['Location'] = content
        content = ''
      }
      // compress content
      const gzipped = gzip(req, content)
      if (gzipped) {
        headers['Content-Encoding'] = 'gzip'
        content = gzipped
      }
      res.writeHead(status, headers)

      // write http response
      if (content instanceof Buffer || typeof content === 'string') {
        res.end(content)
      } else if (content instanceof ReadableStream) {
        pipe(content, res)
      }

      // log request
      const endTime = new Date()
      const ms = endTime.getTime() - startTime.getTime()
      // @ts-expect-error contentLength will exist if content is ReadableStream
      const length = result.contentLength || content.length || 0
      const line = `${endTime.toISOString()} ${status} ${req.method} ${req.url} ${length} ${ms}ms`
      if (status < 400) {
        console.log(line)
      } else {
        // highlight errors red
        console.log(`\x1b[31m${line}\x1b[0m`)
      }
    })
    server.on('error', reject)
    server.listen(port, resolve)
  })
}

/**
 * If the request accepts gzip, compress the content, else undefined
 * @param {http.IncomingMessage} req
 * @param {string | Buffer | ReadableStream} content
 * @returns {Buffer | undefined}
 */
function gzip(req, content) {
  if (!(content instanceof Buffer) || !(typeof content === 'string')) return undefined
  const acceptEncoding = req.headers['accept-encoding']
  if (acceptEncoding?.includes('gzip')) {
    return zlib.gzipSync(content)
  }
}

/**
 * @param {string} url
 * @returns {void}
 */
function openUrl(url) {
  switch (process.platform) {
  case 'darwin': exec(`open ${url}`); return
  case 'win32': exec(`start ${url}`); return
  case 'linux': exec(`xdg-open ${url}`); return
  default: throw new Error(`unsupported platform ${process.platform}`)
  }
}
