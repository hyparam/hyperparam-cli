#!/usr/bin/env node

if (process.argv[2] === 'chat') {
  import('./chat.js').then(({ chat }) => chat())
} else {
  // Load file or directory
  import('./serve.js').then(({ serve }) => serve({ path: process.argv[2] }))
}
