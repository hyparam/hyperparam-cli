#!/usr/bin/env node

if (process.argv[2] === 'chat') {
  import('./chat.js').then(({ chat }) => chat())
} else {
  console.log('usage: hyperparam chat')
}
