import { HighTable } from 'hightable'
import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { data } from './data'
import './HighTable.css'
import './index.css'

const app = document.getElementById('app')
if (!app) throw new Error('missing app element')

ReactDOM.createRoot(app).render(<StrictMode>
  <HighTable data={data} cacheKey='demo' />
</StrictMode>)
