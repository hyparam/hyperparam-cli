#!/usr/bin/env node

import fs from 'fs/promises'
import hyperparamPackage from '../package.json' with { type: 'json' }
import { chat } from './chat.js'
import { serve } from './serve.js'

const arg = process.argv[2]
if (arg === 'chat') {
  chat()
} else if (arg === '--help' || arg === '-H' || arg === '-h') {
  console.log('Usage:')
  console.log('  hyperparam [path]         start hyperparam webapp. "path" is a directory or a URL.')
  console.log('                            defaults to the current directory.')
  console.log('  hyperparam chat           start chat client')
  console.log('  ')
  console.log('  hyperparam -h, --help,    give this help list')
  console.log('  hyperparam -v, --version  print program version')
} else if (arg === '--version' || arg === '-V' || arg === '-v') {
  console.log(hyperparamPackage.version)
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
