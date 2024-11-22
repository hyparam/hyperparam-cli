import Page from './Page.js'

interface AppProps {
  apiBaseUrl: string
}

export default function App(props: AppProps) {
  return (
    <Page {...props} />
  )
}
