#!/usr/bin/env node

import fs from 'fs/promises'
import packageJson from '../package.json' with { type: 'json' }
import { chat } from './chat.js'
import { serve } from './serve.js'
import { login } from './login.js'

const updateCheck = checkForUpdates()

const arg = process.argv[2]
if (arg === 'chat') {
  await updateCheck // wait for update check to finish before chat
  chat()
} else if (arg === 'login') {
  await updateCheck
  await login()
} else if (arg === '--help' || arg === '-H' || arg === '-h') {
  console.log('Usage:')
  console.log('  hyperparam [path]         start hyperparam webapp. "path" is a directory or a URL.')
  console.log('                            defaults to the current directory.')
  console.log('  hyperparam chat           start chat client')
  console.log('  ')
  console.log('  hyperparam -h, --help,    give this help list')
  console.log('  hyperparam -v, --version  print program version')
} else if (arg === '--version' || arg === '-V' || arg === '-v') {
  console.log(packageJson.version)
} else if (!arg) {
  serve(process.cwd(), undefined) // current directory
} else if (/^https?:\/\//.exec(arg)) {
  serve(undefined, arg) // url
} else {
  // resolve file or directory
  fs.stat(arg).then(async stat => {
    const path = await fs.realpath(arg)
    if (stat.isDirectory()) {
      serve(path, undefined)
    } else if (stat.isFile()) {
      const parent = path.split('/').slice(0, -1).join('/')
      const key = path.split('/').pop()
      serve(parent, key)
    }
  }).catch(() => {
    console.error(`Error: file ${process.argv[2]} does not exist`)
    process.exit(1)
  })
}

/**
 * Check for updates and notify user if a newer version is available.
 * Runs in the background.
 * @returns {Promise<void>}
 */
async function checkForUpdates() {
  const abortController = new AbortController()
  const timeout = 1000 // ms
  const timeoutId = setTimeout(() => abortController.abort(), timeout)

  try {
    const currentVersion = packageJson.version
    const response = await fetch('https://registry.npmjs.org/hyperparam/latest', {
      signal: abortController.signal,
    })
    const { version } = await response.json()
    if (version && version !== currentVersion) {
      console.log(`\x1b[33mA newer version of hyperparam is available: ${version} (current: ${currentVersion})\x1b[0m`)
      console.log('\x1b[33mRun \'npm install -g hyperparam\' to update\x1b[0m')
    }
  } catch {
    // fail silently
  } finally {
    clearTimeout(timeoutId)
  }
}
