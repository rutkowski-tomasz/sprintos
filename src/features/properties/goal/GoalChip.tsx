import { Chip } from '../Chip'
import { GOAL_COLOR, formatGoalLabel } from './goalDef'
import type { Goal } from '@/types'

export function GoalChip({ goal }: { goal: Pick<Goal, 'emoji' | 'name'> }) {
  return <Chip color={GOAL_COLOR}>{formatGoalLabel(goal)}</Chip>
}
