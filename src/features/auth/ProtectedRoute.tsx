import { Navigate } from 'react-router-dom'
import { useSession } from './useSession'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useSession()

  if (loading) return null
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}
