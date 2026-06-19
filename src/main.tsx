import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { db } from './lib/db'
import { supabase } from './lib/supabase'
import { setupSync } from './lib/sync'

db.open()

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
