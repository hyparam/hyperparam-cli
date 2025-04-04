import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './assets/global.css'
import App from './components/App/App.js'

const root = document.getElementById('app')
if (!root) throw new Error('missing root element')
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
)
