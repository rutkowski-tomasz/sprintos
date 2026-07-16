import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Zap, CalendarDays, List, Target, Settings, PanelLeft } from 'lucide-react'
import { Logo } from './Logo'
import { cn } from '@/lib/utils'

const NAV_PRIMARY = [
  { to: '/sprint/current', label: 'Current sprint', icon: Zap },
  { to: '/sprint/next', label: 'Next sprint', icon: CalendarDays },
  { to: '/backlog', label: 'Backlog', icon: List },
]

const NAV_SECONDARY = [
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/settings', label: 'Settings', icon: Settings },
]

const COLLAPSE_STORAGE_KEY = 'sidebar-collapsed'

function navLinkClassName(collapsed: boolean, isActive: boolean): string {
  return cn(
    'flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors',
    collapsed && 'justify-center px-0',
    isActive
      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
      : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
  )
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_STORAGE_KEY) === '1')

  function toggleCollapsed() {
    setCollapsed(prev => {
      const next = !prev
      localStorage.setItem(COLLAPSE_STORAGE_KEY, next ? '1' : '0')
      return next
    })
  }

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col shrink-0 min-h-screen border-r border-border bg-sidebar p-3 gap-0.5 transition-[width] duration-200',
        collapsed ? 'w-14' : 'w-52',
      )}
    >
      <div className={cn('flex items-center gap-2 px-2 py-3 mb-1', collapsed && 'justify-center px-0')}>
        <Logo size={22} />
        {!collapsed && <span className="font-semibold text-sm text-sidebar-foreground">SprintOS</span>}
      </div>
      <nav className="flex-1 flex flex-col gap-0.5">
        {NAV_PRIMARY.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            className={({ isActive }) => navLinkClassName(collapsed, isActive)}
          >
            <Icon size={15} />
            {!collapsed && label}
          </NavLink>
        ))}
        <div className="my-1 border-t border-border" />
        {NAV_SECONDARY.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            className={({ isActive }) => navLinkClassName(collapsed, isActive)}
          >
            <Icon size={15} />
            {!collapsed && label}
          </NavLink>
        ))}
      </nav>
      <button
        onClick={toggleCollapsed}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className={cn(
          'flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 transition-colors',
          collapsed && 'justify-center px-0',
        )}
      >
        <PanelLeft size={15} />
        {!collapsed && 'Collapse'}
      </button>
    </aside>
  )
}
