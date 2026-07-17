import type { ReactNode } from 'react'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'

interface SiteHeaderProps {
  viewName: string
  children?: ReactNode
}

export function SiteHeader({ viewName, children }: SiteHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2">
        <SidebarTrigger className="-ml-1 hidden md:flex" />
        <Separator orientation="vertical" className="mx-2 hidden h-4 md:block" />
        <h1 className="text-xl font-semibold">{viewName}</h1>
        <div className="flex-1" />
        {children}
      </div>
    </header>
  )
}
