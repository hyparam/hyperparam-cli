import 'hightable/src/HighTable.css'
import ReactDOM from 'react-dom/client'
import { HashRouter, Route, Routes } from 'react-router'
import Basic from './Basic.js'
import Controlled from './Controlled.js'
import Mirror from './Mirror.js'
import Selection from './Selection.js'
import './index.css'

const app = document.getElementById('app')
if (!app) throw new Error('missing app element')
ReactDOM.createRoot(app).render(<HashRouter>
  <Routes>
    <Route path="/" element={<Basic />} />
    <Route path="/selection" element={<Selection />} />
    <Route path="/controlled" element={<Controlled />} />
    <Route path="/mirror" element={<Mirror />} />
  </Routes>
</HashRouter>)
