import { useEffect, useRef, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate, useRoutes } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { AuthPage } from '@/features/auth/AuthPage'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { AppSidebar } from '@/features/navigation/AppSidebar'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { BottomBar } from '@/features/navigation/BottomBar'
import type { CommandBarHandle } from '@/features/command-bar/CommandBar'
import { MatchingTasksPanel } from '@/features/command-bar/MatchingTasksPanel'
import { SprintView } from '@/views/SprintView'
import { Backlog } from '@/views/Backlog'
import { Goals } from '@/views/Goals'
import { Settings } from '@/views/Settings'
import { SharePage } from '@/features/share/SharePage'
import type { Task } from '@/types'

const ROUTE_ORDER = ['/sprint/current', '/sprint/next', '/backlog']
const SIDEBAR_STORAGE_KEY = 'sidebar-open'

const VIEW_ROUTES = [
  { path: '/sprint/:key', element: <SprintView /> },
  { path: '/sprint/:key/:taskId', element: <SprintView /> },
  { path: '/backlog', element: <Backlog /> },
  { path: '/backlog/:taskId', element: <Backlog /> },
  { path: '/goals', element: <Goals /> },
  { path: '/settings', element: <Settings /> },
  { path: '/', element: <Navigate to="/sprint/current" replace /> },
  { path: '*', element: <Navigate to="/sprint/current" replace /> },
]

function AnimatedContent() {
  const location = useLocation()
  const element = useRoutes(VIEW_ROUTES, location)

  const tabRootPath = ROUTE_ORDER.find(r => location.pathname === r || location.pathname.startsWith(`${r}/`)) ?? location.pathname
  const currentIdx = ROUTE_ORDER.indexOf(tabRootPath)
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
        key={tabRootPath}
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
  const [searchFocused, setSearchFocused] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(() => localStorage.getItem(SIDEBAR_STORAGE_KEY) !== '0')
  const commandBarRef = useRef<CommandBarHandle>(null)
  const navigate = useNavigate()

  function handleSidebarOpenChange(open: boolean) {
    setSidebarOpen(open)
    localStorage.setItem(SIDEBAR_STORAGE_KEY, open ? '1' : '0')
  }

  function openTaskDetail(task: Task) {
    const path = task.sprint ? `/sprint/${task.sprint.replace(/ /g, '-')}/${task.id}` : `/backlog/${task.id}`
    navigate(path)
    setSearchFocused(false)
    commandBarRef.current?.close()
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault()
        commandBarRef.current?.flash()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={handleSidebarOpenChange} className="h-dvh min-h-0">
      <AppSidebar onQuickCreate={() => commandBarRef.current?.flash()} />
      <SidebarInset className="flex flex-col overflow-hidden min-h-0">
        <div className="flex-1 relative overflow-hidden min-h-0 pt-safe bg-background">
          <AnimatedContent />
          <AnimatePresence>
            {searchFocused && (
              <MatchingTasksPanel
                inputValue={inputValue}
                onCopy={text => commandBarRef.current?.setValue(text)}
                onOpen={openTaskDetail}
              />
            )}
          </AnimatePresence>
        </div>
        <BottomBar
          searchFocused={searchFocused}
          onFocusChange={setSearchFocused}
          inputValue={inputValue}
          onInputChange={setInputValue}
          commandBarRef={commandBarRef}
        />
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route
        path="/share"
        element={
          <ProtectedRoute>
            <SharePage />
          </ProtectedRoute>
        }
      />
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
