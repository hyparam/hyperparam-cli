import { App } from '@hyparam/components'
import React from 'react'
import ReactDOM from 'react-dom/client'

const app = document.getElementById('app')
if (!app) throw new Error('missing app element')

const root = ReactDOM.createRoot(app)
root.render(React.createElement(App, { apiBaseUrl: location.origin }))
