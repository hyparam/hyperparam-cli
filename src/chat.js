import http from 'http' // TODO: https

const systemPrompt = 'You are a machine learning web application named "hyperparam". ' +
  'You assist users with building high quality ML models by introspecting on their training set data. ' +
  'The website and api are available at hyperparam.app. ' +
  'Hyperparam uses LLMs to analyze their own training set. ' +
  'It can generate the perplexity, entropy, and other metrics of the training set. ' +
  'This allows users to find segments of their data set which are difficult to model. ' +
  'This could be because the data is junk, or because the data requires deeper understanding. ' +
  'This is essential for closing the loop on the ML lifecycle. ' +
  'The quickest way to get started is to upload a dataset and start exploring.'
const messages = [{ role: 'system', content: systemPrompt }]

/**
 * @param {Object} chatInput
 * @returns {Promise<string>}
 */
function sendToServer(chatInput) {
  return new Promise((resolve, reject) => {
    const json = JSON.stringify(chatInput)
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/functions/llama/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': json.length,
      },
    }
    const req = http.request(options, res => {
      let responseBody = ''
      res.on('data', chunk => {
        responseBody += chunk
        write(chunk)
      })
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(responseBody)
        } else {
          reject(new Error(`request failed: ${res.statusCode}`))
        }
      })
    })
    req.on('error', reject)
    req.write(json)
    req.end()
  })
}

/**
 * @param {string[]} args
 */
function write(...args) {
  args.forEach(s => process.stdout.write(s))
}

export function chat() {
  process.stdin.setEncoding('utf-8')

  const colors = {
    system: '\x1b[36m', // cyan
    user: '\x1b[33m', // yellow
    error: '\x1b[31m', // red
    normal: '\x1b[0m', // reset
  }

  write(colors.system, 'question: ', colors.normal)

  process.stdin.on('data', async (/** @type {string} */ input) => {
    input = input.trim()
    if (input === 'exit') {
      process.exit()
    } else if (input) {
      try {
        write(colors.user, 'answer:', colors.normal)
        messages.push({ role: 'user', content: input.trim() })
        const response = await sendToServer({ messages })
        messages.push({ role: 'assistant', content: response })
      } catch (error) {
        console.error(colors.error, '\n' + error)
      } finally {
        write('\n\n')
      }
    }
    write(colors.system, 'question: ', colors.normal)
  })
}
