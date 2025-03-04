import { getHttpSource } from '../lib/sources/httpSource.js'
import { getHyperparamSource } from '../lib/sources/hyperparamSource.js'
import Page from './Page.js'

export default function App() {
  const search = new URLSearchParams(location.search)
  const sourceId = search.get('key') ?? ''
  const row = search.get('row') === null ? undefined : Number(search.get('row'))
  const col = search.get('col') === null ? undefined : Number(search.get('col'))

  const source = getHttpSource(sourceId) ?? getHyperparamSource(sourceId, { endpoint: location.origin })

  if (!source) {
    return <div>Could not load a data source. You have to pass a valid source in the url.</div>
  }
  return (
    <Page
      source={source}
      navigation={{ row, col }}
      config={{
        slidePanel: {},
        routes: {
          getSourceRouteUrl: ({ sourceId }) => `/files?key=${sourceId}`,
          getCellRouteUrl: ({ sourceId, col, row }) => `/files?key=${sourceId}&col=${col}&row=${row}`,
        },
      }}
    />
  )
}
