import { Chip } from '../Chip'
import { classifySprintKey, formatSprintKey, SPRINT_LABEL_COLOR } from './sprintDef'

export function SprintChip({ sprint, now }: { sprint: string | null; now: Date }) {
  if (!sprint) {
    return <Chip muted>Backlog</Chip>
  }
  const label = classifySprintKey(sprint, now)
  return (
    <Chip color={SPRINT_LABEL_COLOR[label]}>
      {`Sprint ${formatSprintKey(sprint, now)} · ${label}`}
    </Chip>
  )
}
