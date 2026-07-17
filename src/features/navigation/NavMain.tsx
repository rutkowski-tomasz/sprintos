import type { LucideIcon } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'

interface NavMainItem {
  to: string
  label: string
  icon: LucideIcon
}

export function NavMain({ items }: { items: NavMainItem[] }) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map(({ to, label, icon: Icon }) => (
            <SidebarMenuItem key={to}>
              <NavLink to={to}>
                {({ isActive }) => (
                  <SidebarMenuButton asChild tooltip={label} isActive={isActive}>
                    <span>
                      <Icon />
                      <span>{label}</span>
                    </span>
                  </SidebarMenuButton>
                )}
              </NavLink>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
