import { sprintKeyOffset } from '@/features/properties/sprint/sprintDef'

export type CommandKey = 'current' | 'next' | 'previous' | 'future' | 'past' | 'backlog' | 'settings'

export interface CommandDef {
  key: CommandKey
  token: string
  description: string
}

export const COMMANDS: CommandDef[] = [
  { key: 'current', token: '/current', description: 'Jump to the current sprint' },
  { key: 'next', token: '/next', description: 'Jump to the next sprint' },
  { key: 'previous', token: '/previous', description: 'Jump to the previous sprint' },
  { key: 'future', token: '/future', description: 'Jump two sprints ahead' },
  { key: 'past', token: '/past', description: 'Jump two sprints back' },
  { key: 'backlog', token: '/backlog', description: 'Jump to the backlog' },
  { key: 'settings', token: '/settings', description: 'Open app settings' },
]

export function matchCommands(input: string): CommandDef[] {
  const q = input.toLowerCase()
  return COMMANDS.filter(c => c.token.startsWith(q))
}

export function routeForCommand(key: CommandKey, now: Date): string {
  switch (key) {
    case 'current': return '/sprint/current'
    case 'next': return '/sprint/next'
    case 'previous': return '/sprint/previous'
    case 'future': return `/sprint/${sprintKeyOffset(now, 2).replace(/ /g, '-')}`
    case 'past': return `/sprint/${sprintKeyOffset(now, -2).replace(/ /g, '-')}`
    case 'backlog': return '/backlog'
    case 'settings': return '/settings'
  }
}
