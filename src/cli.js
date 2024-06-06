#!/usr/bin/env node

if (process.argv[2] === 'chat') {
  import('./chat.js').then(({ chat }) => chat())
} else if (process.argv[2] === 'serve') {
  import('./serve.js').then(({ serve }) => serve())
} else {
  console.log('usage:')
  console.log('hyperparam chat')
  console.log('hyperparam serve')
}
