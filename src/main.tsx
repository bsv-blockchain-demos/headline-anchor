import './mocks/mockFetch' // design-preview only: no-op unless VITE_USE_FIXTURES=true. Do not merge to main.
import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
