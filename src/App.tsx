import { AuthPage } from '@/components/AuthPage'
import { Button } from '@/components/ui/button'
import { useSession } from '@/hooks/useSession'
import { supabase } from '@/lib/supabase'

export default function App() {
  const { session, loading } = useSession()

  if (loading) return null
  if (!session) return <AuthPage />

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
