#!/usr/bin/env node

if (process.argv[2] === 'chat') {
  require('./chat').chat()
  return
} else {
  console.log('usage: hyperparam chat')
}
