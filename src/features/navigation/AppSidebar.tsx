import type { ComponentProps } from 'react'
import { useMemo } from 'react'
import {
  PlayCircleIcon,
  ChevronRightIcon,
  ChevronDoubleRightIcon,
  ChevronLeftIcon,
  ChevronDoubleLeftIcon,
  QueueListIcon,
  PlusCircleIcon,
} from '@heroicons/react/24/outline'
import { Logo } from './Logo'
import { NavMain } from './NavMain'
import { NavUser } from './NavUser'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { sprintKeyOffset } from '@/features/properties/sprint/sprintDef'
import { IS_MAC } from '@/lib/platform'

const QUICK_CREATE_SHORTCUT = IS_MAC ? '⌘P' : 'Ctrl+P'

interface AppSidebarProps extends ComponentProps<typeof Sidebar> {
  onQuickCreate?: () => void
}

export function AppSidebar({ onQuickCreate, ...props }: AppSidebarProps) {
  const now = useMemo(() => new Date(), [])
  const futureSlug = sprintKeyOffset(now, 2).replace(/ /g, '-')
  const pastSlug = sprintKeyOffset(now, -2).replace(/ /g, '-')

  const upcoming = [
    { to: '/sprint/current', label: 'Current', icon: PlayCircleIcon },
    { to: '/sprint/next', label: 'Next', icon: ChevronRightIcon },
    { to: `/sprint/${futureSlug}`, label: 'Future', icon: ChevronDoubleRightIcon },
  ]
  const history = [
    { to: '/sprint/previous', label: 'Previous', icon: ChevronLeftIcon },
    { to: `/sprint/${pastSlug}`, label: 'Past', icon: ChevronDoubleLeftIcon },
  ]
  const backlog = [{ to: '/backlog', label: 'Backlog', icon: QueueListIcon }]

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2 px-1 py-1">
            <Logo size={22} monochrome />
            <span className="text-sm font-semibold group-data-[collapsible=icon]:hidden">SprintOS</span>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip={`Quick Create (${QUICK_CREATE_SHORTCUT})`}
                  onClick={onQuickCreate}
                  className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
                >
                  <PlusCircleIcon />
                  <span>Quick Create</span>
                  <kbd className="ml-auto rounded border border-primary-foreground/30 px-1 py-px text-[10px] font-mono leading-none text-primary-foreground/70 group-data-[collapsible=icon]:hidden">
                    {QUICK_CREATE_SHORTCUT}
                  </kbd>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <NavMain items={upcoming} />
        <NavMain items={history} />
        <NavMain items={backlog} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
