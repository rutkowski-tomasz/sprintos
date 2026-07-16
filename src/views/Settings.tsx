import { useEffect, useState } from 'react'
import { LogOut } from 'lucide-react'
import { ViewHeader } from '@/features/navigation/ViewHeader'
import { useSession } from '@/features/auth/useSession'
import { useSignOutFlow } from '@/features/auth/useSignOutFlow'
import { supabase } from '@/lib/supabase'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const LOCALES = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'pl-PL', label: 'Polski' },
]

function initials(name: string | undefined, email: string | undefined): string {
  if (name) {
    const parts = name.trim().split(/\s+/)
    return parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase() : parts[0].slice(0, 2).toUpperCase()
  }
  return (email ?? '?').slice(0, 2).toUpperCase()
}

export function Settings() {
  const { session } = useSession()
  const user = session?.user
  const metadata = user?.user_metadata ?? {}
  const name: string | undefined = metadata.full_name ?? metadata.name
  const avatarUrl: string | undefined = metadata.avatar_url ?? metadata.picture

  const [locale, setLocale] = useState<string>('en-US')
  const [saving, setSaving] = useState(false)
  const { requestSignOut, dialog } = useSignOutFlow()

  useEffect(() => {
    if (metadata.locale) setLocale(metadata.locale)
  }, [metadata.locale])

  async function handleLocaleChange(value: string) {
    const previous = locale
    setLocale(value)
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ data: { locale: value } })
    if (error) setLocale(previous)
    setSaving(false)
  }

  return (
    <div className="h-full flex flex-col overflow-auto pb-safe-nav">
      <ViewHeader viewName="Settings" />
      <div className="p-4 max-w-md w-full flex flex-col gap-6">
        <section className="flex items-center gap-3">
          <Avatar size="lg">
            <AvatarImage src={avatarUrl} alt={name ?? user?.email ?? 'User'} />
            <AvatarFallback>{initials(name, user?.email)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            {name && <span className="text-sm font-medium truncate">{name}</span>}
            {user?.email && <span className="text-xs text-muted-foreground truncate">{user.email}</span>}
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <label className="text-xs font-medium text-muted-foreground">Language</label>
          <Select value={locale} onValueChange={handleLocaleChange} disabled={saving}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LOCALES.map(l => (
                <SelectItem key={l.value} value={l.value}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>

        <section>
          <Button variant="outline" onClick={requestSignOut}>
            <LogOut />
            Sign out
          </Button>
        </section>
      </div>
      {dialog}
    </div>
  )
}
