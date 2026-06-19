import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthPage } from '@/components/AuthPage'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Button } from '@/components/ui/button'
import { useSession } from '@/hooks/useSession'
import { supabase } from '@/lib/supabase'

function AppShell() {
  const { session } = useSession()
  if (!session) return null

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">SprintOS</h1>
        <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()}>
          Sign out
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">Phase 2 in progress</p>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/current" replace />} />
    </Routes>
  )
}
