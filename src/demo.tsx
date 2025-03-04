import 'hightable/src/HighTable.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import DemoApp from './components/DemoApp.js'
import './styles/demo.css'

const root = document.getElementById('root')
if (!root) throw new Error('missing root element')
createRoot(root).render(
  <StrictMode>
    <DemoApp />
  </StrictMode>,
)
