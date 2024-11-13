import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.js'
import './index.css'

const app = document.getElementById('app')
if (!app) throw new Error('missing app element')

const params = new URLSearchParams(location.search)
const url = params.get('key') ?? undefined

ReactDOM.createRoot(app).render(<StrictMode>
  <App url={url} />
</StrictMode>)
