import { ReactNode } from 'react'
import Page from './Page.js'
import Welcome from './Welcome.js'

export default function App(): ReactNode {
  const params = new URLSearchParams(location.search)
  const url = params.get('key') ?? undefined
  return url ? <Page url={url} /> : <Welcome />
}
