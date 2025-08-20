import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './init-db.js'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)


// Feature-flagged service worker registration
import { APP_CONFIG } from './constants/index.js'
if (APP_CONFIG.FEATURES.SERVICE_WORKER && typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/static/service-worker.js').catch(err => {
      console.error('Service worker registration failed:', err)
    })
  })
}
