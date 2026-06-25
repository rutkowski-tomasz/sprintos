import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { db } from './lib/db'
import { supabase } from './lib/supabase'
import { setupSync } from './features/sync/sync'

db.open()

if ('serviceWorker' in navigator) {
  // Force update check on every open so deployments are detected immediately.
  navigator.serviceWorker.getRegistration().then(reg => reg?.update())

  // Reload the page when a new SW takes control — the new assets are now in
  // cache and a reload is the only way to swap them in for the current session.
  let reloading = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return
    reloading = true
    window.location.reload()
  })
}

let cleanupSync: (() => void) | null = null
supabase.auth.onAuthStateChange((_event, session) => {
  if (session && !cleanupSync) {
    cleanupSync = setupSync()
  } else if (!session && cleanupSync) {
    cleanupSync()
    cleanupSync = null
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename="/sprintos">
      <App />
    </BrowserRouter>
  </StrictMode>,
)
