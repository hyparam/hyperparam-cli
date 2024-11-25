import Page, { PageConfig } from './Page.js'

export type AppConfig = PageConfig

interface AppProps {
  apiBaseUrl: string
  config?: AppConfig
}

export default function App(props: AppProps) {
  return (
    <Page {...props} />
  )
}
