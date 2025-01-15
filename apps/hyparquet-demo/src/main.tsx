import 'hightable/src/HighTable.css'
import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.js'
import './index.css'

const app = document.getElementById('app')
if (!app) throw new Error('missing app element')

ReactDOM.createRoot(app).render(<StrictMode>
  <App />
</StrictMode>)
