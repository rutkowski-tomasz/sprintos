import { useNavigate } from 'react-router-dom'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'
import { useSession } from '@/features/auth/useSession'

export function NavUser() {
  const navigate = useNavigate()
  const { session } = useSession()
  const email = session?.user.email ?? ''

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" onClick={() => navigate('/settings')}>
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarFallback className="rounded-lg">{email.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{email}</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
