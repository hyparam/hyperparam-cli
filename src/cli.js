#!/usr/bin/env node

if (process.argv[2] === 'chat') {
  import('./chat.js').then(({ chat }) => chat())
} else {
  import('./serve.js').then(({ serve }) => serve())
}
