import { Chip } from '../Chip'
import { SPRINT_COLOR } from './sprintParserDef'
import { formatSprintKey } from './sprintDef'

export function SprintChip({ sprint, now }: { sprint: string; now: Date }) {
  return <Chip color={SPRINT_COLOR}>{`Sprint ${formatSprintKey(sprint, now)}`}</Chip>
}
