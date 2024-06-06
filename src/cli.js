#!/usr/bin/env node

if (process.argv[2] === 'chat') {
  require('./chat').chat()
} else {
  console.log('usage: hyperparam chat')
}
