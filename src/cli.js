#!/usr/bin/env node

import fs from 'fs'
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
  serve()
} else if (arg.match(/^https?:\/\//)) {
  serve(arg) // url
} else {
  // resolve file or directory
  const path = fs.realpathSync(arg)
  if (fs.existsSync(path)) {
    serve(path)
  } else {
    console.error(`Error: file ${process.argv[2]} does not exist`)
    process.exit(1)
  }
}
