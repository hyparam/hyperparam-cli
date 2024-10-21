#!/usr/bin/env node

import fs from 'fs/promises'
import { chat } from './chat.js'
import { serve } from './serve.js'

const arg = process.argv[2]
if (arg === 'chat') {
  chat()
} else if (arg === '--help') {
  console.log('Usage:')
  console.log('  hyperparam [path]')
  console.log('  hyperparam chat')
} else if (!arg) {
  serve(process.cwd(), undefined) // current directory
} else if (arg.match(/^https?:\/\//)) {
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
