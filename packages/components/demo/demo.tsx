import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from '../src/index.ts'

const url = new URL(location.href)
if (!url.searchParams.has('key')) {
  location.href = 'http://localhost:5173/?key=https://huggingface.co/datasets/severo/test-parquet/resolve/main/parquet/csv-train-00000-of-00001.parquet'
}

const app = document.getElementById('app')
if (!app) throw new Error('missing app element')

const root = ReactDOM.createRoot(app)
root.render(React.createElement(App, { apiBaseUrl: location.origin }))
