import { NavLink } from 'react-router-dom'
import { Zap, CalendarDays, LayoutList, List, Target, Timer, LogOut } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { supabase } from '@/lib/supabase'

const NAV = [
  { to: '/current', label: 'Current', icon: Zap },
  { to: '/next', label: 'Next', icon: CalendarDays },
  { to: '/planning', label: 'Planning', icon: LayoutList },
  { to: '/all-tasks', label: 'All Tasks', icon: List },
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/sprints', label: 'Sprints', icon: Timer },
]

export function Sidebar() {
  return (
    <>
      <aside className="hidden md:flex flex-col w-52 shrink-0 min-h-screen border-r border-border bg-sidebar p-3 gap-0.5">
        <div className="flex items-center gap-2 px-2 py-3 mb-1">
          <Logo size={22} />
          <span className="font-semibold text-sm text-sidebar-foreground">SprintOS</span>
        </div>
        <nav className="flex-1 flex flex-col gap-0.5">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                    : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
                }`
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={() => supabase.auth.signOut()}
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 transition-colors"
        >
          <LogOut size={15} />
          Sign out
        </button>
      </aside>

      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-sidebar border-t border-border flex z-50">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 text-[9px] font-medium transition-colors ${
                isActive ? 'text-sidebar-primary' : 'text-sidebar-foreground/40'
              }`
            }
          >
            <Icon size={18} />
            <span>{label === 'All Tasks' ? 'All' : label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  )
}
