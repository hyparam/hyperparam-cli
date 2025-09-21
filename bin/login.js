import fs from 'fs/promises'
import os from 'os'
import path from 'path'

/** @import {DeviceCodeResponse, DeviceTokenResponse, DeviceTokenErrorResponse} from './types.d.ts' */

const DEVICE_CODE_URL = 'https://oauth2.googleapis.com/device/code'
const TOKEN_URL = 'https://hyperparam.app/api/auth/token'
const scope = 'openid email profile'
const DEFAULT_POLL_INTERVAL_MS = 5000
const clientId = '87924894949-ligc0177ofrjubu7mhsh9m60h11stas6.apps.googleusercontent.com'

/**
 * Guides the user through Google device login and persists the refresh token.
 */
export async function login() {
  const deviceCode = await requestDeviceCode({ clientId, scope })

  const verificationLink = deviceCode.verification_url_complete
    ?? `${deviceCode.verification_url}?user_code=${encodeURIComponent(deviceCode.user_code)}`

  console.log('To finish signing in:')
  console.log(`  1. Visit ${verificationLink}`)
  console.log(`  2. If prompted, enter code: ${deviceCode.user_code}`)
  console.log('Waiting for you to authorize in the browser...')

  /** @type {DeviceTokenResponse} */
  const tokens = await pollForTokens({
    clientId,
    deviceCode,
  })

  if (!tokens.refresh_token) {
    console.error('Error: Google did not return a refresh token. Try removing access for the app and re-running "hyperparam login".')
    process.exit(1)
  }

  const credentialsPath = await writeCredentials({
    clientId,
    scope,
    refreshToken: tokens.refresh_token,
    tokenResponse: tokens,
  })

  console.log(`Login successful. Credentials saved to ${credentialsPath}`)
}

/**
 * Requests a device code for the configured client and scope.
 * @param {{ clientId: string, scope: string }} params
 * @returns {Promise<DeviceCodeResponse>}
 */
async function requestDeviceCode({ clientId, scope }) {
  const body = new URLSearchParams({
    client_id: clientId,
    scope,
  })

  let response
  try {
    response = await fetch(DEVICE_CODE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Error contacting Google OAuth endpoint:', message)
    process.exit(1)
  }

  if (!response.ok) {
    const details = await readResponseBody(response)
    console.error('Error requesting device code from Google:', details)
    process.exit(1)
  }

  const payload = await response.json()
  if (!payload || typeof payload !== 'object') {
    console.error('Unexpected response from Google during login:', payload)
    process.exit(1)
  }

  // eslint-disable-next-line no-extra-parens
  const deviceCode = /** @type {DeviceCodeResponse} */ (/** @type {unknown} */ (payload))
  if (typeof deviceCode.device_code !== 'string'
    || typeof deviceCode.user_code !== 'string'
    || typeof deviceCode.verification_url !== 'string'
    || typeof deviceCode.expires_in !== 'number') {
    console.error('Unexpected response from Google during login:', payload)
    process.exit(1)
  }

  return deviceCode
}

/**
 * Polls Google's device endpoint until tokens arrive or the flow times out.
 * @param {{ clientId: string, deviceCode: DeviceCodeResponse }} params
 * @returns {Promise<DeviceTokenResponse>}
 */
async function pollForTokens({ clientId, deviceCode }) {
  const expiresAt = Date.now() + (deviceCode.expires_in ?? 900) * 1000
  let intervalMs = (deviceCode.interval ?? DEFAULT_POLL_INTERVAL_MS / 1000) * 1000

  while (Date.now() < expiresAt) {
    await delay(intervalMs)

    const body = new URLSearchParams({
      client_id: clientId,
      device_code: deviceCode.device_code,
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
    })

    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    })

    const payload = await readResponseBody(response)

    if (response.ok) {
      if (!payload || typeof payload !== 'object') {
        console.error('Unexpected response from Google during login:', payload)
        process.exit(1)
      }
      // eslint-disable-next-line no-extra-parens
      const tokenPayload = /** @type {DeviceTokenResponse} */ (/** @type {unknown} */ (payload))
      if (typeof tokenPayload.access_token !== 'string'
        || typeof tokenPayload.token_type !== 'string'
        || typeof tokenPayload.expires_in !== 'number') {
        console.error('Unexpected response from Google during login:', payload)
        process.exit(1)
      }
      return tokenPayload
    }

    if (!payload || typeof payload !== 'object') {
      console.error('Unexpected error response from Google during login:', payload)
      process.exit(1)
    }

    // eslint-disable-next-line no-extra-parens
    const errorPayload = /** @type {DeviceTokenErrorResponse} */ (/** @type {unknown} */ (payload))
    if (typeof errorPayload.error !== 'string') {
      console.error('Unexpected error response from Google during login:', payload)
      process.exit(1)
    }

    if (errorPayload.error === 'authorization_pending') {
      continue
    }

    if (errorPayload.error === 'slow_down') {
      intervalMs += 5000
      continue
    }

    if (errorPayload.error === 'access_denied') {
      console.error('Login cancelled in browser.')
      process.exit(1)
    }

    if (errorPayload.error === 'expired_token') {
      console.error('Login request expired before approval. Run "hyperparam login" again.')
      process.exit(1)
    }

    const description = errorPayload.error_description ? ` (${errorPayload.error_description})` : ''
    console.error(`Google returned an error while completing login: ${errorPayload.error}${description}`)
    process.exit(1)
  }

  console.error('Login timed out before approval. Run "hyperparam login" again.')
  process.exit(1)
}

/**
 * Writes the OAuth credentials file with restrictive permissions.
 * @param {{ clientId: string, scope: string, refreshToken: string, tokenResponse: DeviceTokenResponse }} params
 * @returns {Promise<string>}
 */
async function writeCredentials({ clientId, scope, refreshToken, tokenResponse }) {
  const dir = path.join(os.homedir(), '.hyp')
  const file = path.join(dir, 'credentials.json')

  await fs.mkdir(dir, { recursive: true, mode: 0o700 })

  /** @type {{
   *   provider: 'google',
   *   client_id: string,
   *   scope: string,
   *   refresh_token: string,
   *   obtained_at: string,
   *   token_endpoint: string,
   *   id_token?: string
   * }}
   */
  const payload = {
    provider: 'google',
    client_id: clientId,
    scope,
    refresh_token: refreshToken,
    obtained_at: new Date().toISOString(),
    token_endpoint: TOKEN_URL,
  }

  if (tokenResponse.id_token) {
    payload.id_token = tokenResponse.id_token
  }

  await fs.writeFile(file, `${JSON.stringify(payload, null, 2)}\n`, { mode: 0o600 })
  await fs.chmod(file, 0o600)

  return file
}

/**
 * Reads and parses a fetch Response body if present.
 * @param {Response} response
 * @returns {Promise<object | string | undefined>}
 */
async function readResponseBody(response) {
  const text = await response.text()
  if (!text) {
    return undefined
  }

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

/**
 * @param {number} ms
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
