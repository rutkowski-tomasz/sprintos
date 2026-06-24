import { useRef } from 'react'
import { Navigate, Route, Routes, useLocation, useRoutes } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { AuthPage } from '@/components/AuthPage'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { CurrentSprint } from '@/views/CurrentSprint'
import { NextSprint } from '@/views/NextSprint'
import { Backlog } from '@/views/Backlog'
import { Goals } from '@/views/Goals'

const ROUTE_ORDER = ['/current', '/next', '/backlog']

const VIEW_ROUTES = [
  { path: '/current', element: <CurrentSprint /> },
  { path: '/next', element: <NextSprint /> },
  { path: '/backlog', element: <Backlog /> },
  { path: '/goals', element: <Goals /> },
  { path: '/', element: <Navigate to="/current" replace /> },
  { path: '*', element: <Navigate to="/current" replace /> },
]

function AnimatedContent() {
  const location = useLocation()
  const element = useRoutes(VIEW_ROUTES, location)

  const currentIdx = ROUTE_ORDER.indexOf(location.pathname)
  const prevIdxRef = useRef(currentIdx)
  const dirRef = useRef(0)

  if (currentIdx !== -1 && currentIdx !== prevIdxRef.current) {
    dirRef.current = currentIdx > prevIdxRef.current ? 1 : -1
    prevIdxRef.current = currentIdx
  }

  const d = dirRef.current

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ x: `${d * 25}%`, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: `${d * -25}%`, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        className="absolute inset-0 overflow-hidden"
      >
        {element}
      </motion.div>
    </AnimatePresence>
  )
}

function AppShell() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 relative overflow-hidden">
        <AnimatedContent />
      </main>
      <BottomNav />
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
    </Routes>
  )
}
