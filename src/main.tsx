import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import type { Session } from '@supabase/supabase-js'
import { db, clearLocalData } from './lib/db'
import { supabase } from './lib/supabase'
import { setupSync } from './features/sync/sync'
import { consumeIntentionalSignOut } from './features/auth/signOut'

const LAST_USER_KEY = 'sprintos:lastUserId'

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

async function handleAuthChange(session: Session | null) {
  if (session && !cleanupSync) {
    const lastUserId = localStorage.getItem(LAST_USER_KEY)
    const userChanged = lastUserId !== null && lastUserId !== session.user.id
    localStorage.setItem(LAST_USER_KEY, session.user.id)
    if (userChanged) await clearLocalData()
    cleanupSync = setupSync()
  } else if (!session && cleanupSync) {
    cleanupSync()
    cleanupSync = null
    if (consumeIntentionalSignOut()) {
      await clearLocalData()
      localStorage.removeItem(LAST_USER_KEY)
    }
  }
}

supabase.auth.onAuthStateChange((_event, session) => {
  handleAuthChange(session)
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename="/sprintos">
      <App />
    </BrowserRouter>
  </StrictMode>,
)
