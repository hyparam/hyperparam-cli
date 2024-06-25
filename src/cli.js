#!/usr/bin/env node

import fs from 'fs'

if (process.argv[2] === 'chat') {
  import('./chat.js').then(({ chat }) => chat())
} else if (process.argv[2] === '--help') {
  console.log('Usage:')
  console.log('  hyperparam [path]')
  console.log('  hyperparam chat')
} else if (process.argv[2].match(/^https?:\/\//)) {
  // Load URL
  import('./serve.js').then(({ serve }) => serve(process.argv[2]))
} else if (fs.existsSync(process.argv[2])) {
  // Load file or directory
  import('./serve.js').then(({ serve }) => serve(process.argv[2]))
} else {
  console.error(`Error: file ${process.argv[2]} does not exist`)
  process.exit(1)
}
