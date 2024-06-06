/**
 * Dependency-free http server for serving static files
 */

import { exec } from 'child_process'
import fs from 'fs/promises'
import http from 'http'
import path from 'path'
import url from 'url'
import zlib from 'zlib'

const serveDirectory = 'public'

/** @type {Object<string, string>} */
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.map': 'application/json',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
}

/**
 * @typedef {T | Promise<T>} Awaitable<T>
 * @template T
 */

/**
 * Route an http request
 * @typedef {{ status: number, content: string | Buffer, contentType?: string }} ServeResult
 * @param {http.IncomingMessage} req
 * @returns {Awaitable<ServeResult>}
 */
function handleRequest(req) {
  if (!req.url) return { status: 400, content: 'bad request' }
  const parsedUrl = url.parse(req.url, true)
  const pathname = parsedUrl.pathname || ''
  console.log(`request ${req.method} ${pathname}`)

  if (pathname === '/' || pathname === '/files') {
    // redirect to /files
    return { status: 301, content: '/files/' }
  } else if (pathname.startsWith('/files/')) {
    // serve index.html
    return handleStatic('/index.html')
  } else if (pathname.startsWith('/public/')) {
    // serve static files
    return handleStatic(pathname.slice(7))
  } else if (pathname === '/api/store/list') {
    // serve file list
    const prefix = parsedUrl.query.prefix?.[0] || ''
    return handleListing(prefix)
  } else {
    return { status: 404, content: 'not found' }
  }
}

/**
 * Serve static file from the serve directory
 * @param {string} pathname
 * @returns {Promise<ServeResult>}
 */
async function handleStatic(pathname) {
  const filePath = path.join(process.cwd(), serveDirectory, pathname)
  const stats = await fs.stat(filePath).catch(() => undefined)
  if (!stats || !stats.isFile()) {
    return { status: 404, content: 'not found' }
  }

  // detect content type
  const extname = path.extname(filePath)
  if (!mimeTypes[extname]) {
    console.error(`serving unknown mimetype ${extname}`)
  }
  const contentType = mimeTypes[extname] || 'application/octet-stream'

  const content = await fs.readFile(filePath)
  return { status: 200, content, contentType }
}

/**
 * List files from local storage
 *
 * @param {string} prefix file path prefix
 * @returns {Promise<ServeResult>}
 */
async function handleListing(prefix) {
  const dir = `${process.cwd()}/${prefix}`
  try {
    const stat = await fs.stat(dir)
    if (!stat.isDirectory()) return { status: 400, content: 'not a directory' }
  } catch (error) {
    return { status: 404, content: 'not found' }
  }

  const files = []
  for (const filename of await fs.readdir(dir, { recursive: false })) {
    // get stats for each file
    const filePath = `${dir}/${filename}`
    const stat = await fs.stat(filePath)

    if (stat.isFile()) {
      files.push({
        key: filename,
        fileSize: stat.size,
        lastModified: stat.mtime.toISOString(),
      })
    } else if (stat.isDirectory()) {
      files.push({
        key: filename + '/',
        lastModified: stat.mtime.toISOString(),
      })
    }
  }

  return { status: 200, content: JSON.stringify(files), contentType: 'application/json' }
}

/**
 * Start http server on given port
 * @param {number} port
 */
export function serve(port = 2048) {
  // create http server
  http.createServer(async (req, res) => {
    const startTime = new Date()

    // handle request
    /** @type {ServeResult} */
    let result = { status: 500, content: 'internal server error' }
    try {
      result = await handleRequest(req)
    } catch (err) {
      console.error('error handling request', err)
    }
    let { status, content, contentType } = result

    // write http header
    /** @type {http.OutgoingHttpHeaders} */
    const headers = { 'Connection': 'keep-alive' }
    if (contentType) headers['Content-Type'] = contentType
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
    res.end(content)

    // log request
    const endTime = new Date()
    const ms = endTime.getTime() - startTime.getTime()
    const line = `${endTime.toISOString()} ${status} ${req.method} ${req.url} ${content.length} ${ms}ms`
    if (status < 400) {
      console.log(line)
    } else {
      // highlight errors red
      console.log(`\x1b[31m${line}\x1b[0m`)
    }
  }).listen(port, () => {
    console.log(`hyperparam server running on http://localhost:${port}`)
    openUrl(`http://localhost:${port}`)
  })
}

/**
 * If the request accepts gzip, compress the content, else undefined
 * @param {http.IncomingMessage} req
 * @param {string | Buffer} content
 * @returns {Buffer | undefined}
 */
function gzip(req, content) {
  if (!content) return undefined
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
