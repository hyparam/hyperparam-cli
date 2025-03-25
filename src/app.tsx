import 'hightable/src/HighTable.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './components/App.js'
import './styles/app.css'

const root = document.getElementById('app')
if (!root) throw new Error('missing root element')
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
)
